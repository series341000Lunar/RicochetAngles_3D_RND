// V3 presentation-only pooled lights. No projectile or gameplay writes.
export function createMuzzleLights(THREE,scene){
  const config={enabled:true,durationMs:90,holdMs:20};
  const slots={};
  for(const role of ['player','boss']){
    const light=new THREE.PointLight(new THREE.Color(1,.90,.74),0,0,2);
    light.name='V3_'+role+'_MUZZLE_LIGHT';light.castShadow=false;light.visible=true;
    scene.add(light);slots[role]={light,born:-Infinity,game:null,actor:null,pulses:0,peak:0};
  }
  const forward=new THREE.Vector3();
  function stop(s){s.light.intensity=0;s.light.visible=true;s.game=null;s.actor=null;}
  function clear(){for(const s of Object.values(slots))stop(s);}
  return {config,slots,clear,
    trigger(role,node,game,actor,scale=1){
      if(!config.enabled||!slots[role]||!node||!actor.alive)return;
      const s=slots[role];node.updateWorldMatrix(true,false);
      node.getWorldPosition(s.light.position);
      forward.set(1,0,0).transformDirection(node.matrixWorld);
      s.light.position.addScaledVector(forward,1.4*scale);
      s.peak=role==='boss'?120000*scale*scale:54000;
      s.light.distance=role==='boss'?135*scale:115;
      s.born=performance.now();s.game=game;s.actor=actor;s.pulses++;
      s.light.intensity=s.peak;s.light.visible=true;
    },
    sync(game,enabled){
      const now=performance.now();
      for(const s of Object.values(slots)){
        const age=now-s.born;
        if(!config.enabled||!enabled||s.game!==game||!s.actor?.alive||game.state!=='playing'||age<0||age>=config.durationMs){stop(s);continue;}
        const t=Math.max(0,(age-config.holdMs)/(config.durationMs-config.holdMs));
        s.light.intensity=s.peak*(1-t)*(1-t);s.light.visible=true;
      }
    }
  };
}
