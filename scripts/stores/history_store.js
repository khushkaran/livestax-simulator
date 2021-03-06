"use strict";

var AppDispatcher = require("../dispatchers/app_dispatcher");
var EventEmitter = require("events").EventEmitter;
var Constants = require("../constants/app_constants");
var ActionTypes = Constants.ActionTypes;
var HistoryTypes = Constants.History;
var CHANGE_EVENT = Constants.ChangeTypes.HISTORY_CHANGE;
var Immutable = require("immutable");
var Moment = require("moment");

var getFromStorage = () => {
  if (window.localStorage.history) {
    return JSON.parse(window.localStorage.history);
  } else {
    return {
      apps: [],
      messages: []
    };
  }
};

var saveToStorage = (data) => {
  window.localStorage.history = JSON.stringify(data);
};

class HistoryStore extends EventEmitter {
  constructor() {
    this._registerInterests();
    this.reset();
  }

  emitChange() {
    this.emit(CHANGE_EVENT);
  }

  addChangeListener(callback) {
    this.on(CHANGE_EVENT, callback);
  }

  removeChangeListener(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }

  _addHistoryItem(key, data) {
    if (this._state.get(key) && !this._doesItemExistInState(key, data)) {
      var timestamp = Moment().unix();
      data = data.set("createdAt", timestamp);

      this._state = this._state.update(key, (history) => history.push(data));
      saveToStorage(this._state.toJS());
    }
  }

  _doesItemExistInState(key, data) {
    return this._state.get(key).map(item => item.delete("createdAt")).contains(data);
  }

  _historyItemIndex(key, item) {
    return this._state.get(key).findIndex((val) => {
      return Immutable.is(val, item);
    });
  }

  _removeHistoryItem(payload) {
    var key = payload.key;
    var index = this._historyItemIndex(key, payload.item.delete("historyType"));

    if (index > -1) {
      this._state = this._state.deleteIn([key, index]);
      saveToStorage(this._state.toJS());
    }
  }

  replaceState(state) {
    if(!Immutable.is(state, Immutable.fromJS(state))) {
      console.warn("replaceState expects an Immutable data structure");
    }
    this._state = state;
    this.emitChange();
  }

  reset() {
    this._state = Immutable.fromJS(getFromStorage());
  }

  _clearHistory() {
    window.localStorage.clear();
    this.reset();
  }

  injectHistoryType(data) {
    return data.map((value, key) => {
      return value.map((item) => item.set("historyType", key));
    });
  }

  concatTypes(types) {
    return types.reduce((acc, value) => {
      return acc.concat(value);
    }, Immutable.List());
  }

  allHistory() {
    return this.concatTypes(this.injectHistoryType(this._state));
  }

  getTypesByKey(keys) {
    return Immutable.List(keys).reduce((acc, key) => {
      return acc.set(key, this._state.get(key));
    }, Immutable.Map());
  }

  filteredHistory(filters) {
    var types = this.getTypesByKey(filters);
    return this.concatTypes(this.injectHistoryType(types));
  }

  getHistory(...filters) {
    if(filters.length === 0 || filters[0] === undefined) {
      return this.allHistory();
    }
    return this.filteredHistory(filters);
  }

  getHistoryTypes() {
    var currentTypes = this._state.filter((list) => {
      return !list.isEmpty();
    });
    return Immutable.List(currentTypes.keys());
  }

  _processAppConfigPayload(payload) {
    payload = payload.set("name", payload.getIn(["app", "name"]));
    if(!payload.getIn(["app", "use_post"])) {
      payload = this._blankPostData(payload);
    }
    return payload;
  }

  _blankPostData(payload) {
    return payload.set("post_data", Immutable.fromJS({payload: {}}));
  }

  _registerInterests() {
    AppDispatcher.register((action) => {
      var payload = action.payload;
      switch(action.type) {
        case ActionTypes.RECEIVE_APP_CONFIGURATION:
          if (payload) {
            this._addHistoryItem(HistoryTypes.APPS, this._processAppConfigPayload(payload));
          }
        break;

        case ActionTypes.RECEIVE_GENERATED_MESSAGE:
          payload = payload.set("name", `${payload.get("namespace")}.${payload.get("key")} = ${payload.get("value")}`);
          this._addHistoryItem(HistoryTypes.MESSAGES, payload);
        break;

        case ActionTypes.DELETE_HISTORY_ITEM:
          this._removeHistoryItem(payload);
        break;

        case ActionTypes.CLEAR_HISTORY:
          this._clearHistory();
        break;
      }
      this.emitChange();
      return true;
    });
  }
}

module.exports = new HistoryStore();
