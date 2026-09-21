// V1: single selected-target silhouette mask. No picking, gameplay writes, grayscale or Fresnel.
export function createTargetContour(THREE,renderer,view){
  const maskTarget=new THREE.WebGLRenderTarget(1280,720,{depthBuffer:true,stencilBuffer:false});
  maskTarget.texture.minFilter=maskTarget.texture.magFilter=THREE.NearestFilter;
  maskTarget.texture.generateMipmaps=false;
  const maskScene=new THREE.Scene();maskScene.background=new THREE.Color(0);
  const white=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide});
  const screenScene=new THREE.Scene(),screenCamera=new THREE.Camera();
  const material=new THREE.ShaderMaterial({
    uniforms:{mask:{value:maskTarget.texture},texel:{value:new THREE.Vector2(1/1280,1/720)},width:{value:2.5}},
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
    fragmentShader:
      'uniform sampler2D mask; uniform vec2 texel; uniform float width; varying vec2 vUv;'+
      'void main(){float center=texture2D(mask,vUv).r;float edge=0.0;'+
      'for(int y=-1;y<=1;y++){for(int x=-1;x<=1;x++){edge=max(edge,texture2D(mask,vUv+vec2(float(x),float(y))*texel*width).r);}}'+
      'float alpha=edge*(1.0-center);if(alpha<0.01)discard;gl_FragColor=vec4(1.0,0.85,0.05,alpha);}',
    transparent:true,depthTest:false,depthWrite:false,toneMapped:false
  });
  const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);quad.frustumCulled=false;screenScene.add(quad);
  const pairs=[];let selectedRoot=null;
  const state={targetId:null,meshCount:0,thickness:2.5};
  function syncRoot(root){
    if(root!==selectedRoot){
      pairs.forEach(p=>maskScene.remove(p.copy));pairs.length=0;selectedRoot=root;
      if(root)root.traverse(source=>{
        if(!source.isMesh)return;
        const copy=new THREE.Mesh(source.geometry,white);copy.matrixAutoUpdate=false;copy.frustumCulled=false;
        maskScene.add(copy);pairs.push({source,copy});
      });
    }
    if(root){
      root.updateMatrixWorld(true);
      pairs.forEach(p=>{p.copy.matrix.copy(p.source.matrixWorld);p.copy.matrixWorld.copy(p.source.matrixWorld);p.copy.visible=p.source.visible;});
    }
  }
  function render(targetId,root){
    state.targetId=root?targetId:null;syncRoot(root);state.meshCount=pairs.length;
    if(!root)return;
    const oldTarget=renderer.getRenderTarget(),oldClear=renderer.autoClear;
    try{
      renderer.autoClear=true;renderer.setRenderTarget(maskTarget);renderer.render(maskScene,view);
      renderer.setRenderTarget(oldTarget);renderer.autoClear=false;renderer.render(screenScene,screenCamera);
    }finally{renderer.setRenderTarget(oldTarget);renderer.autoClear=oldClear;}
  }
  return {render,state};
}
