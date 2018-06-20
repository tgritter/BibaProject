import React, { Component } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { Constants, MapView, Location, Permissions } from 'expo';

const SCREEN_WIDTH = Dimensions.get('window').width
const SCREEN_HEIGHT = Dimensions.get('window').height

export default class App extends Component {
  
  constructor(props){
  super(props);
  this.state = {
    loading: true,
    latCenter: null,
    lngCenter: null,
    latDelat: null,
    lngDelta: null,
    playgroundsList: [],
  }
} 

  componentWillMount(){
    this._getLocationAsync()
  }

  //Get the Location of the User
  _getLocationAsync = async () => {
   let { status } = await Permissions.askAsync(Permissions.LOCATION); 
   if (status !== 'granted') {
     console.log('Access Denied')
   }else{
     
     let location = await Location.getCurrentPositionAsync({});
     
     var initialLat = location.coords.latitude
     var initialLng = location.coords.longitude

     
     this.setState({ 
       latCenter: initialLat, 
       lngCenter: initialLng 
     });
     
     this._fetchPlaygroundData(initialLat, initialLng)     
   }
  };
 
 _fetchPlaygroundData = async (lat, lng) => {
  try {
    let response = await fetch(
      'http://playgrounds.endpoints.biba-services.cloud.goog/v2/playgrounds?center=' + lat + ',' + lng 
    );
    let playgroundJson = await response.json();

    var playgroundList = []
    
    var latDeltaFurthest = 0.0001
    var lngDeltaFurthest = 0.0001
    
    for(var i = 0; i < playgroundJson.length; i++){
      
      //Get playground distance
      var data = playgroundJson[i]
      var latPlayground = parseFloat(data.location.latitude)
      var lngPlayground = parseFloat(data.location.longitude)
      
      //If current playground is furthest away from center then it becomes the new furthest

      var latPlaygroundDelta = Math.abs(lat - latPlayground )
      var lngPlaygroundDelta = Math.abs(lng - lngPlayground )
      if(latPlaygroundDelta > latDeltaFurthest){
        latDeltaFurthest = latPlaygroundDelta
      }
      if(lngPlaygroundDelta > lngDeltaFurthest){
        lngDeltaFurthest = lngPlaygroundDelta
      }
      
      //Create playground object and add to List
      var playgroundObject = { 
        id: data.id,
        coordinate: {latitude: latPlayground, longitude: lngPlayground},
        address: data.address
      }
      playgroundList.push(playgroundObject)
    }
    
    this.setState({
      playgrounds: playgroundList,
      latDelta: (latDeltaFurthest * 2),
      lngDelta: lngDeltaFurthest * 2, 
      loading: false
    }) 
    
    return playgroundJson;
    
    } catch (error) {
    console.error(error);            
  }
}
 
 //Get playground data with new center of map
 _handleMapRegionChange = mapRegion => {
   this._fetchPlaygroundData(mapRegion.latitude, mapRegion.longitude)    
 };
 
 renderLoadingView(){
   return(
     <View style={styles.container}>
       <ActivityIndicator size="large" color="black" /> 
     </View>
   )
 }

  render() {
    if(this.state.loading){
      return(this.renderLoadingView())
    }else{
        return (
          <View style={styles.container}>
            <MapView
              style={styles.map} 
              initialRegion={{
                latitude: this.state.latCenter, 
                longitude: this.state.lngCenter, 
                latitudeDelta: this.state.latDelta,
                longitudeDelta: this.state.lngDelta,
              }}
              onRegionChangeComplete={this._handleMapRegionChange}  
            >
            {this.state.playgrounds.map(marker => (
              <MapView.Marker
                key={marker.id} 
                coordinate={marker.coordinate}
                title={marker.address}
              />
            ))}
            </MapView>    
          
            <View style={styles.header}>
              <Text style={styles.text}>Find a Playground!</Text> 
            </View>
          
          </View> 
        );
      }
    }
  }


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  map: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT
  },
  header: {
    position: 'absolute', 
    top: 0,
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 60,
    backgroundColor: 'orange',   
  },
  text: {
    fontSize: 20, 
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,  
  },
});
