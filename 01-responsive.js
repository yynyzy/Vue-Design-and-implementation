// 桶结构，收集副作用函数, WeakMap<any, Map<any, Set<any>>>
const bucket = new WeakMap();

// 保存当前注册的副作用函数
let activeEffect = '';

const dataSource = {
  text: 'observe obj before change'
};

const effect = (fn) => {
  // 每次触发副作用函数时先清除对应key的副作用函数依赖
  const effectFn = () => {
    cleanup(effectFn);
    activeEffect = effectFn;
    fn();
  };
  effectFn.deps = [];
  effectFn();
};

const cleanup = (effectFn) => {
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i];
    deps.delete(effectFn);
  };
  effectFn.deps.length = 0;
};

const track = (target, key) => {
  let target_in_bucket = bucket.get(key);
  // 往 bucket 中注册目标对象
  if(!target_in_bucket) {
    target_in_bucket = new Map();
    bucket.set(target, target_in_bucket)
  }

  let deps = target_in_bucket.get(key);
  // 在 bucket 中目标对象的每一个key 添加对应的副作用函数，使用 Set 防止出现重复的副作用函数，
  if(!deps) {
    deps = new Set();
    target_in_bucket.set(key, deps);
  }
  deps.add(activeEffect);
  activeEffect.deps.push(deps);
};

const trigger = (target, key) => {
  let target_in_bucket = bucket.get(target);
  if(!target_in_bucket) return;
  // 获取桶中对应 target 的对象并且拿到对应 key 的副作用 Set，如果存在，触发他们
  let effects = target_in_bucket.get(key);
  // 使用一个新set作为 effects 放入副本，防止死循环，副作用函数触发导致 effects 重写遍历
  const effectsTemp = new Set(effects);
  effectsTemp.forEach(effect => effect());
};

const obj = new Proxy(dataSource, {
  get(target, key) {
    track(target, key);
    return target[key];
  },
  set(target, key, newVal) {
    target[key] = newVal;
    trigger(target, key);
    return true;
  },
});

effect(()=>{ document.body.innerHTML = obj.text });

setTimeout(()=> {
  obj.text = 'observe obj after change';
}, 2000);
