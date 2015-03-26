"use strict";

var React = require("react");
var CollapsiblePanel = require("./lib/collapsible_panel");
var HistoryStore = require("../stores/history_store");
var HistoryActions = require("../actions/history_actions");
var Constants = require("../constants/app_constants");
var FilterList = require("./lib/filter_list");
var PanelToolbar = require("./lib/panel_toolbar");
var HistoryTypes = Constants.History;
var Moment = require("moment");
var Immutable = require("immutable");

var timestampToDateString = (timestamp) => {
  return Moment.unix(timestamp).format("DD/MM/YYYY, HH:mm");
};

var historyIcons = Immutable.Map()
  .set(HistoryTypes.APPS, "cog")
  .set(HistoryTypes.MESSAGES, "volume-off");

var getFilters = () => {
  var labels = Immutable.Map()
    .set(HistoryTypes.APPS, "App config")
    .set(HistoryTypes.MESSAGES, "Messages");

  return HistoryStore.getHistoryTypes().map((item) => {
    return Immutable.Map({
      label: labels.get(item),
      data: item
    });
  });
};

var doesFilterExist = (list, filter) => {
  return list.map((item) => {
    return item.get("data");
  }).contains(filter);
};

var History = React.createClass({
  propTypes: {
    onClick: React.PropTypes.func.isRequired,
    historyKey: React.PropTypes.string
  },

  getInitialState() {
    return Immutable.fromJS({
      historyItems: HistoryStore.getHistory(this.props.historyKey),
      filters: getFilters(),
      filter: undefined
    });
  },

  componentDidMount() {
    HistoryStore.addChangeListener(this._onChange);
  },

  componentWillUnmount() {
    HistoryStore.removeChangeListener(this._onChange);
  },

  _onChange() {
    this.onFilterChange(this.state.get("filter"));
  },

  triggerHistoryClick(historyItem) {
    this.props.onClick(historyItem);
  },

  deleteHistoryItem(key, historyItem) {
    HistoryActions.deleteHistoryItem(key, historyItem);
  },

  getHistoryType(item) {
    if(item.has("historyType")) {
      return item.get("historyType");
    }
    return this.props.historyKey;
  },

  buildHistoryItemsList() {
    var icon;
    return this.state.get("historyItems").map((historyItem, i) => {
      icon = `fa fa-${historyIcons.get(this.getHistoryType(historyItem))} text-muted`;

      return (
        <tr key={historyItem}>
          <td onClick={this.triggerHistoryClick.bind(this, historyItem)}><i className={icon}></i></td>
          <td className="item-content" onClick={this.triggerHistoryClick.bind(this, historyItem)}>
            <span className="timestamp text-muted">{timestampToDateString(historyItem.get("createdAt"))}</span>
            {historyItem.get("name")}
          </td>

          <td className="delete-item" onClick={this.deleteHistoryItem.bind(this, historyItem.get("historyType"), historyItem)}>
            <i className="fa fa-times text-muted"></i>
          </td>
        </tr>
      );
    }).toJS();
  },

  onFilterChange(filter) {
    var filters = getFilters();

    if(!doesFilterExist(filters, filter)) {
      filter = undefined;
    }

    var nextState = this.state
      .set("filters", filters)
      .set("filter", filter)
      .set("historyItems", HistoryStore.getHistory(filter));

    this.replaceState(nextState);
  },

  render() {
    return (
      <CollapsiblePanel heading={this.props.heading}>
        <PanelToolbar>
          <FilterList filters={this.state.get("filters").toJS()}
            active={this.state.get("filter")}
            onFilterChange={this.onFilterChange} />
        </PanelToolbar>

        <table className="table table-condensed table-hover history-table">
          <tbody>
            {this.buildHistoryItemsList()}
          </tbody>
        </table>
      </CollapsiblePanel>
    );
  }
});

module.exports = History;
