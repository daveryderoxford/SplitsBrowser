"use strict";
// Delay in milliseconds between a resize event being triggered and the
// page responding to it.
// (Resize events tend to come more than one at a time; if a resize event
// comes in while a previous event is waiting, the previous event is
// cancelled.)
var RESIZE_DELAY_MS = 100;

var currentResizeTimeout = null;
var currentResult = null;
var selection = null;
var currentIndexes = [];
var selectionChangeHandler = null;

var selection = null;
var competitorListBox = null;
var chart = null;
var topPanel = null;
var mainPanel = null;

var _COMPETITOR_LIST_CONTAINER_ID = "competitorListContainer";

/**
* Construct the UI inside the HTML body.
*/
function buildUi() {
    var body = d3.select("body");
    var mainPanel = body.append("div");
    
    var competitorListContainer = mainPanel.append("div")
                                           .attr("id", _COMPETITOR_LIST_CONTAINER_ID);
                                           
    var buttonsContainer = competitorListContainer.append("div");
                                     
    buttonsContainer.append("button")
                    .text("All")
                    .on("click", selectAll);
                    
    buttonsContainer.append("button")
                    .text("None")
                    .on("click", selectNone);
                                                       
    competitorListBox = new SplitsBrowser.Controls.CompetitorListBox(competitorListContainer.node());
    chart = new SplitsBrowser.Controls.Chart(mainPanel.node());
}

/**
* Select all of the competitors.
*/
function selectAll() {
    selection.selectAll();
}

/**
* Select none of the competitors.
*/
function selectNone() {
    selection.selectNone();
}

/**
 * Handle a resize of the window.
 */
function handleWindowResize() {
    if (currentResizeTimeout != null) {
        clearTimeout(currentResizeTimeout);
    }

    currentResizeTimeout = setTimeout(function () { currentResizeTimeout = null; drawChart(); }, RESIZE_DELAY_MS);
}

/**
* Draw the chart using the current data.
*/
function drawChart() {

    var fastestTime = currentResult.getFastestTime();
    var chartData = currentResult.getChartData(fastestTime, currentIndexes);
    var cumTimes = fastestTime.getCumulativeTimes();

    var windowWidth = $(window).width();
    var windowHeight = $(window).height();

    competitorListBox.setCompetitorList(currentResult.competitorData);

    // Subtract some values to avoid scrollbars appearing.
    var chartWidth = windowWidth - 18 - competitorListBox.width() - 40;
    var chartHeight = windowHeight - 19;

    chart.setSize(chartWidth, chartHeight);
    chart.drawChart(chartData, cumTimes, currentIndexes);

    if (selectionChangeHandler != null) {
        selection.deregister(selectionChangeHandler);
    }

    selectionChangeHandler = function (indexes) {
        currentIndexes = indexes;
        chartData = currentResult.getChartData(fastestTime, indexes);
        chart.drawChart(chartData, cumTimes, indexes);
    };

    selection.register(selectionChangeHandler);

    $("body").height(windowHeight - 19);
    $("#competitorListContainer").height(windowHeight - 19 - $("#allOrNoneButtonsPanel").height());
}

/**
* JQuery AJAX callback to handle the request to get some data and parse it.
*/
function readEventData(data, status, jqXHR) {
    if (status == "success") {
        var result = SplitsBrowser.Input.CSV.parseEventData(data);
        currentResult = result[0];
        selection = new SplitsBrowser.Model.CompetitorSelection(currentResult.competitorData.length);
        competitorListBox.setSelection(selection);
        drawChart();
    } else {
        alert("Got status " + status + ". :(");
    }
}


function testReadSplits(events_url) {
    $.ajax({
        url: events_url,
        data: "",
        success: readEventData,
        dataType: "text",
    });
}

$(document).ready(buildUi);
$(document).ready(testReadSplits('data/eventdata'));

$(window).resize(handleWindowResize);
