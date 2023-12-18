// 桶结构，收集副作用函数, WeakMap<any, Map<any, Set<any>>>
const bucket = new WeakMap();

// 保存当前注册的副作用函数
let activeEffect = '';

const dataSource = {
  text: 'observe obj before change'
}

const obj = new Proxy(dataSource, {
  get(target, key) {
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
    return target[key];
  },
  set(target, key, newVal) {
    target[key] = newVal;
    let target_in_bucket = bucket.get(target);
    if(!target_in_bucket) return;
    // 获取桶中对应 target 的对象并且拿到对应 key 的副作用 Set，如果存在，触发他们
    let effects = target_in_bucket.get(key);
    effects && effects.forEach((fn) => fn());
    return true;
  },
})

const effect = (fn) => {
  activeEffect = fn;
  fn();
};
effect(()=>{ document.body.innerHTML = obj.text });

setTimeout(()=> {
  obj.text = 'observe obj after change';
}, 2000);
