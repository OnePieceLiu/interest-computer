const cycleUnits = ["年", "月", "周", "日"]

const afterCycles = [
  { value: "compound", name: "利息转本金，计算复利" },
  { value: "principal", name: "剩余本金生息" },
  { value: "payoff", name: "默认还清，按需再记" }
];

const repaymentTypes = [
  { value: "principalFirst", name: "先本后息" },
  { value: "equalRatio", name: "等比本息" },
  { value: "interestFirst", name: "先息后本" }
];

function getEnumName(_enum = [], value){
  if(typeof _enum[0] === 'object'){
    const item = _enum.find(item=>item.value===value)
    return item ? item.name : ''
  }else if(typeof _enum[0] === 'string'){
    const item = _enum.find((item, idx)=>idx===value)
    return item ? item : ''
  }
}

module.exports = {
  cycleUnits, 
  afterCycles,
  repaymentTypes,

  getEnumName
}