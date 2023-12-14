const bucket = new Set(); // 桶，收集副作用函数

// 保存当前注册的副作用函数
let activeEffect = '';

const dataSource = {
  text: '123'
}

const obj = new Proxy(dataSource, {
  get(target, key) {
    bucket.add(activeEffect);
    return target[key];
  },
  set(target, key, newVal) {
    target[key] = newVal;
    bucket.forEach((fn) => fn());
    return true;
  },
})

const effect = (fn) => {
  activeEffect = fn;
  fn();
};
effect(()=>{ document.body.innerHTML = obj.text });

setTimeout(()=> {
  obj.text = '999';
}, 2000);
