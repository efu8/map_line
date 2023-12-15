// Copyright 2021 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Loader } from '@googlemaps/js-api-loader';
//three.js
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

const apiOptions = {
  "apiKey": "AIzaSyA-UCAj3hGLE677ACV0aOryWL90we2249I",
  //ベクター地図を有効に
  "version": "beta"
};

const mapOptions = {
  //カメラの角度
  "tilt": 70,
  //カメラの向き
  "heading": 80,
  //ズーム具合
  "zoom": 18.5,
  //中心座標
  "center": { lat: 35.6075802, lng: 139.6859476 },
  "mapId": "a4f554844912db7a"
};

async function initMap() {    
  const mapDiv = document.getElementById("map");
  const apiLoader = new Loader(apiOptions);
  await apiLoader.load()      
  return new google.maps.Map(mapDiv, mapOptions);
}

function initWebGLOverlayView (map) {
  let scene, renderer, camera, loader;
  // WebGLOverlayView code goes here
  const webGLOverlayView = new google.maps.WebGLOverlayView();
  //life cycle huck
  //webGLOverlayView.onAdd = () => {};
  webGLOverlayView.onAdd = () => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();
    //環境光源
    const ambientLight = new THREE.AmbientLight( 0xffffff, 0.75 );
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.25);
    directionalLight.position.set(0.5, -1, 0.5);
    scene.add(directionalLight);

    loader = new GLTFLoader();
    //ピンの3Dモデル
    const source = "pin.gltf";
    loader.load(
      source,
      gltf => {
        //3Dモデルのサイズ,小さくすると地面から浮く
        gltf.scene.scale.set(25,25,25);
        gltf.scene.rotation.x = 180 * Math.PI/180;
        scene.add(gltf.scene);
      }
    );
  }


  //webGLOverlayView.onContextRestored = ({gl}) => {};
  webGLOverlayView.onContextRestored = ({gl}) => {
    renderer = new THREE.WebGLRenderer({
      canvas: gl.canvas,
      context: gl,
      ...gl.getContextAttributes(),
    });

    renderer.autoClear = false;

    loader.manager.onLoad = () => {
      renderer.setAnimationLoop(() => {
         map.moveCamera({
          "tilt": mapOptions.tilt,
          "heading": mapOptions.heading,
          "zoom": mapOptions.zoom
        });

        if (mapOptions.tilt < 67.5) {
          //mapOptions.tilt += 0.5
        } else if (mapOptions.heading <= 360) {
          //mapOptions.heading += 0.2;
        } else {
          renderer.setAnimationLoop(null)
        }
      });
    }
  }

  webGLOverlayView.onDraw = ({gl, transformer}) => {
    
    const latLngAltitudeLiteral = {
      lat: mapOptions.center.lat,
      lng: mapOptions.center.lng,
      altitude: 100
    }

    const matrix = transformer.fromLatLngAltitude(latLngAltitudeLiteral);
    camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);

    webGLOverlayView.requestRedraw();
    renderer.render(scene, camera);
    renderer.resetState();
  }

  //OverLay Instance
  webGLOverlayView.setMap(map)

}


(async () => {        
  const map = await initMap();
  initWebGLOverlayView(map);
})();