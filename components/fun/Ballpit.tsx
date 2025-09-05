import React, { Component } from "react";
import { View, Dimensions } from "react-native";
import { THREE } from "expo-three";
import { GLView } from "expo-gl";

const {
  Clock,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  SRGBColorSpace,
  MathUtils,
  Vector2,
  Vector3,
  MeshPhysicalMaterial,
  ShaderChunk,
  Color,
  Object3D,
  InstancedMesh,
  PMREMGenerator,
  SphereGeometry,
  AmbientLight,
  PointLight,
  ACESFilmicToneMapping,
  Raycaster,
  Plane,
} = THREE;

class ThreeRenderer extends Component {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer | null;
  private clock: THREE.Clock;
  private animationFrameId: number | null;
  private isRendering: boolean;

  constructor(props) {
    super(props);
    this.state = {
      width: 0,
      height: 0,
    };

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.renderer = null;
    this.clock = new THREE.Clock();
    this.animationFrameId = null;
    this.isRendering = false;
  }

  componentDidMount() {
    Dimensions.addEventListener("change", this.handleResize);
    this.handleResize();
  }

  componentWillUnmount() {
    Dimensions.removeEventListener("change", this.handleResize);
    this.stopRendering();
  }

  handleResize = () => {
    const { width, height } = Dimensions.get("window");
    this.setState({ width, height }, () => {
      if (this.renderer) {
        this.renderer.setSize(width, height);
      }
      if (this.camera) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
      }
    });
  };

  onContextCreate = async (gl) => {
    const { width, height } = this.state;

    // Create a WebGLRenderer without a DOM element
    this.renderer = new THREE.WebGLRenderer({
      gl,
      width,
      height,
      antialias: true,
    });

    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000);

    this.startRendering();
  };

  startRendering = () => {
    if (!this.isRendering) {
      this.isRendering = true;
      this.renderScene();
    }
  };

  stopRendering = () => {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.isRendering = false;
  };

  renderScene = () => {
    if (!this.isRendering) return;

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    this.onBeforeRender({ delta, elapsed });

    this.renderer.render(this.scene, this.camera);

    this.onAfterRender({ delta, elapsed });

    this.animationFrameId = requestAnimationFrame(this.renderScene);
  };

  onBeforeRender = ({ delta, elapsed }) => {
    // Override this method in subclasses if needed
  };

  onAfterRender = ({ delta, elapsed }) => {
    // Override this method in subclasses if needed
  };

  render() {
    const { width, height } = this.state;
    return (
      <View style={{ width, height }}>
        <GLView style={{ flex: 1 }} onContextCreate={this.onContextCreate} />
      </View>
    );
  }
}

export default ThreeRenderer;
