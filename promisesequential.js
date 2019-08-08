/**
 * @class Sequential
 * @description Promiseを順番に実行する。ただし、Promiseはインスタンス化された瞬間に実行が始まるのでそうなったらどうしようもない。
 * 
 * const sequential = new Sequential();
 * sequential.push(()=>new Promise());
 * sequential.push(()=>new Promise());
 * sequential.push(()=>new Promise());
 * // pushした順番に実行される
 * 
 */
const Sequential = (function () {
    const Sequential = function () {
        this.running = false, this.promisees = [];
    };
    /**
     * @param {()=>Promise} f promiseを返す関数
     */
    Sequential.prototype.push = function (f) {
        const self = this;
        this.promisees.push(() => f().then(() => this._next()));
        this.running || self._next();
    };
    Sequential.prototype._next = function () {
        if (this.running = !!this.promisees.length) this.promisees.shift()();
    };
    return Sequential;
})();


const ps = new Sequential();
for (let i = 0; i < 10; i++) {
    ps.push(() => new Promise(res => {
        setTimeout(() => {
            console.log(i);
            res();
        }, Math.floor(Math.random() * 10));
    }));
}


setTimeout(() => {}, 100);