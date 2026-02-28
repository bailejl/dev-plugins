'use strict';

// Mixed camelCase and snake_case naming throughout

function get_user_data(id) {
  // TODO: connect to real DB
  return { id: id, name: 'test' };
}

function formatUserName(data) {
  if (data && data.name) {
    return data.name.charAt(0).toUpperCase() + data.name.slice(1);
  }
  return '';
}

function process_items(items) {
  var temp = [];
  for (var i = 0; i < items.length; i++) {
    var val = items[i];
    if (val != null && val != undefined) {
      var data = transform_item(val);
      temp.push(data);
    }
  }
  return temp;
}

function transform_item(val) {
  var result = {};
  result.id = val.id;
  result.n = val.name; // abbreviated field name
  result.d = val.description; // abbreviated field name
  result.ts = Date.now();
  return result;
}

function calculateTotal(arr) {
  var temp = 0;
  for (var i = 0; i < arr.length; i++) {
    temp = temp + arr[i].amount;
  }
  return temp;
}

// This does the same thing as calculateTotal but for a different field
function calculate_sum(arr) {
  var temp = 0;
  for (var i = 0; i < arr.length; i++) {
    temp = temp + arr[i].value;
  }
  return temp;
}

function doStuff(x) {
  if (x == true) {
    return 1;
  } else if (x == false) {
    return 0;
  }
  return -1;
}

function handleThing(data) {
  var temp = data;
  var result = temp;
  return result;
}

function check(val) {
  if (val) return true;
  return false;
}

module.exports = {
  get_user_data,
  formatUserName,
  process_items,
  transform_item,
  calculateTotal,
  calculate_sum,
  doStuff,
  handleThing,
  check,
};
