const a = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
];

console.log(a.reduce((x, y) => [...x, ...y]));