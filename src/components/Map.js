import React, {Component} from 'react'
import ReactMapGL from 'react-map-gl'
import {connect} from 'react-redux'

import Dimensions from 'react-dimensions'

import {updateLayer, initLayers} from '../actions/mapActions'

import {BASE_STYLE, generateMapboxStyle} from '../utils/maps/mapbox'
import ReactTooltip from 'react-tooltip'

import {layerListChanged} from "../utils/utils";


import {fromJS, toJS} from 'immutable'

class Map extends Component {
  constructor(props) {
    super(props);
    this.state = {
      viewport: {
        latitude: 40.4393509,
        longitude: -79.9647331,
        zoom: 10,
        minZoom: 9,
      },
      width: window.innerWidth,
      height: window.innerHeight,
      mapStyle: fromJS(BASE_STYLE),
      tooltip: null,
    }
  }

  componentDidMount = () => {
    const {mapLayers, initLayers} = this.props;
    initLayers(mapLayers);
    window.addEventListener('resize', this.updateDimensions)
  };

  updateDimensions = () => {
    this.setState({
      width: window.innerWidth,
      height: window.innerHeight
    })
  };


  componentDidUpdate = (prevProps, prevState) => {
    const {mapLayers: oldLayers} = prevProps;
    const {mapLayers: newLayers} = this.props;

    if (layerListChanged(oldLayers, newLayers)) {
      this.setState({mapStyle: generateMapboxStyle(newLayers)}, () => console.log('changing that state'))
    }

  };

  handleClick = (event) => {
    const {mapStyle} = this.state;
    const workingStyle = mapStyle.toJS();
    if (event && event.features.length) {
      const fillIndex = workingStyle.layers.findIndex(layer => layer.id === 'parcels-select-fill');
      const lineIndex = workingStyle.layers.findIndex(layer => layer.id === 'parcels-select-border');
      console.log(fillIndex, lineIndex)
      this.setState({
        mapStyle: mapStyle
          .setIn(['layers', fillIndex, 'filter', 2], event.features[0].properties['map_identifier'])
          .setIn(['layers', lineIndex, 'filter', 2], event.features[0].properties['map_identifier']),
      })
    }
  };


  handleHover = event => {
    const {mapStyle} = this.state;
    const workingStyle = mapStyle.toJS();
    if (event && event.features.length) {
      const parcelHighlightLayerIndex = workingStyle.layers.findIndex(layer => layer.id === 'parcels-highlight-fill');
      this.setState({
        mapStyle: mapStyle.setIn(['layers', parcelHighlightLayerIndex, 'filter', 2], event.features[0].properties['map_identifier']),
        tooltip: event.features[0].properties['map_name']
      });
    } else {
      this.setState({tooltip: null});
    }
  };

  render() {
    const {width, height, tooltip} = this.state;

    if (this.state.mapStyle !== null) {
      return (
        <div>
          <a data-tip data-for="identifier">
            <ReactMapGL
              mapStyle={this.state.mapStyle}
              onViewportChange={(viewport) => this.setState({viewport})}
              onHover={this.handleHover}
              onClick={this.handleClick}
              transitionDuration={1000}

              {...{...this.state.viewport, ...{width: width - 10, height: height - 64}}}

            >
              <p style={{fontWeight: 800}}>{this.state.viewport.zoom}</p>
            </ReactMapGL>
          </a>
          {tooltip &&
          <ReactTooltip place="right" id="identifier"
                        style={{zIndex: 1000}}>
            <span>{tooltip}</span>
          </ReactTooltip>
          }
        </div>
      )
    } else {
      return <div/>
    }
  }
}

const mapStateToProps = state => {
  const {mapLayers} = state;
  return {mapLayers}
}

const mapDispatchToProps = dispatch => {
  return {
    updateLayer: layerConfig =>
      dispatch(updateLayer(layerConfig)),
    initLayers: layerConfigs =>
      dispatch(initLayers(layerConfigs))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Dimensions()(Map));