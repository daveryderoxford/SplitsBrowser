/*
 *  SplitsBrowser ChartTypeSelector - Provides a choice of chart types.
 *  
 *  Copyright (C) 2000-2014 Dave Ryder, Reinhard Balling, Andris Strazdins,
 *                          Ed Nash, Luke Woodward
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License along
 *  with this program; if not, write to the Free Software Foundation, Inc.,
 *  51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */
(function (){
    "use strict";
    
    var getMessage = SplitsBrowser.getMessage;
    
    /**
    * A control that wraps a drop-down list used to choose the types of chart to view.
    * @param {HTMLElement} parent - The parent element to add the control to.
    * @param {Array} chartTypes - Array of types of chart to list.
    */
    function ChartTypeSelector(parent, chartTypes) {
        this.changeHandlers = [];
        this.chartTypes = chartTypes;
        this.raceGraphDisabledNotifier = null;
        this.lastSelectedIndex = 0;
        
        var div = d3.select(parent).append("div")
                                   .classed("topRowStart", true);
                                   
        this.labelSpan = div.append("span");
           
        var outerThis = this;
        this.dropDown = div.append("select").node();
        $(this.dropDown).bind("change", function() { outerThis.onSelectionChanged(); });
        
        this.optionsList = d3.select(this.dropDown).selectAll("option").data(chartTypes);
        this.optionsList.enter().append("option");
        
        this.optionsList = d3.select(this.dropDown).selectAll("option").data(chartTypes);
        this.optionsList.attr("value", function (_value, index) { return index.toString(); });
                   
        this.optionsList.exit().remove();
        
        this.setMessages();
    }
    
    /**
    * Sets the messages displayed within this control, following either its
    * creation or a change of selected language.
    */
    ChartTypeSelector.prototype.setMessages = function () {
        this.labelSpan.text(getMessage("ChartTypeSelectorLabel"));
        this.optionsList.text(function (value) { return getMessage(value.nameKey); });    
    };
    
    /**
    * Sets the function used to disable the selection of the race graph.
    *
    * If not null, this will be called whenever an attempt to select the race
    * graph is made, and the selection will revert to what it was before.  If
    * it is null, the race graph can be selected.
    *
    * @param {?Function} raceGraphDisabledNotifier - Function to call when the
    *     race graph is selected
    */
    ChartTypeSelector.prototype.setRaceGraphDisabledNotifier = function (raceGraphDisabledNotifier) {
        this.raceGraphDisabledNotifier = raceGraphDisabledNotifier;
        if (this.raceGraphDisabledNotifier !== null && this.chartTypes[this.dropDown.selectedIndex].isRaceGraph) {
            // Race graph has already been selected but now the race graph
            // isn't available, so switch back to the splits graph.
            this.raceGraphDisabledNotifier();
            this.dropDown.selectedIndex = 0;
            this.onSelectionChanged();
        }
    };
    
    /**
    * Add a change handler to be called whenever the selected type of chart is changed.
    *
    * The selected type of chart is passed to the handler function.
    *
    * @param {Function} handler - Handler function to be called whenever the
    *                             chart type changes.
    */
    ChartTypeSelector.prototype.registerChangeHandler = function (handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }    
    };

    /**
    * Returns the currently-selected chart type.
    * @return {Object} The currently-selected chart type.
    */
    ChartTypeSelector.prototype.getChartType = function () {
        return this.chartTypes[Math.max(this.dropDown.selectedIndex, 0)];
    };
    
    /**
    * Sets the chart type.  If the chart type given is not recognised, nothing
    * happens.
    * @param {Object} chartType - The chart type selected.
    */
    ChartTypeSelector.prototype.setChartType = function (chartType) {
        var index = this.chartTypes.indexOf(chartType);
        if (index >= 0) {
            this.dropDown.selectedIndex = index;
            this.onSelectionChanged();
        }
    };
    
    /**
    * Handle a change of the selected option in the drop-down list.
    */
    ChartTypeSelector.prototype.onSelectionChanged = function () {
        if (this.raceGraphDisabledNotifier !== null && this.chartTypes[this.dropDown.selectedIndex].isRaceGraph) {
            this.raceGraphDisabledNotifier();
            this.dropDown.selectedIndex = Math.max(this.lastSelectedIndex, 0);
        }
        
        this.changeHandlers.forEach(function(handler) { handler(this.chartTypes[this.dropDown.selectedIndex]); }, this);
        this.lastSelectedIndex = this.dropDown.selectedIndex;
    };
    
    SplitsBrowser.Controls.ChartTypeSelector = ChartTypeSelector;
})();
