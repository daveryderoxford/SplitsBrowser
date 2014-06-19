﻿/*
 *  SplitsBrowser CompetitorList - Lists the competitors down the left side.
 *  
 *  Copyright (C) 2000-2013 Dave Ryder, Reinhard Balling, Andris Strazdins,
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

    // ID of the competitor list div.
    // Must match that used in styles.css.
    var COMPETITOR_LIST_ID = "competitorList";
    
    // The number that identifies the left mouse button.
    var LEFT_BUTTON = 1;
    
    // Dummy index used to represent the mouse being let go off the bottom of
    // the list of competitors.
    var CONTAINER_COMPETITOR_INDEX = -1;
    
    // ID of the container that contains the list and the filter textbox.
    var COMPETITOR_LIST_CONTAINER_ID = "competitorListContainer";
    
    var getMessage = SplitsBrowser.getMessage;
    var getMessageWithFormatting = SplitsBrowser.getMessageWithFormatting;

    /**
    * Object that controls a list of competitors from which the user can select.
    * @constructor
    * @param {HTMLElement} parent - Parent element to add this list to.
    * @param {Function} alerter - Function to call to issue an alert message.
    */
    var CompetitorList = function (parent, alerter) {
        this.parent = parent;
        this.alerter = alerter;
        this.handler = null;
        this.competitorSelection = null;
        this.lastFilterString = "";
        this.allCompetitors = [];
        this.normedNames = [];
        this.dragging = false;
        this.dragStartCompetitorIndex = null;
        this.currentDragCompetitorIndex = null;
        this.allCompetitorDivs = [];
        this.inverted = false;
        
        this.containerDiv = d3.select(parent).append("div")
                                             .attr("id", COMPETITOR_LIST_CONTAINER_ID);
                                               
        this.buttonsPanel = this.containerDiv.append("div");
                           
        var outerThis = this;
        this.allButton = this.buttonsPanel.append("button")
                                          .attr("id", "selectAllCompetitors")
                                          .text(getMessage("SelectAllCompetitors"))
                                          .style("width", "50%")
                                          .on("click", function () { outerThis.selectAll(); });
                        
        this.noneButton = this.buttonsPanel.append("button")
                                           .attr("id", "selectNoCompetitors")
                                           .text(getMessage("SelectNoCompetitors"))
                                           .style("width", "50%")
                                           .on("click", function () { outerThis.selectNone(); });
                        
        this.buttonsPanel.append("br");
                        
        this.crossingRunnersButton = this.buttonsPanel.append("button")
                                                      .attr("id", "selectCrossingRunners")
                                                      .text(getMessage("SelectCrossingRunners"))
                                                      .style("width", "100%")
                                                      .on("click", function () { outerThis.selectCrossingRunners(); })
                                                      .style("display", "none");
        
        this.filter = this.buttonsPanel.append("input")
                                       .attr("type", "text")
                                       .attr("placeholder", "Filter");

        // Update the filtered list of competitors on any change to the
        // contents of the filter textbox.  The last two are for the benefit of
        // IE9 which doesn't fire the input event upon text being deleted via
        // selection or the X button at the right.  Instead, we use delayed
        // updates to filter on key-up and mouse-up, which I believe *should*
        // catch every change.  It's not a problem to update the filter too
        // often: if the filter text hasn't changed, nothing happens.
        this.filter.on("input", function () { outerThis.updateFilter(); })
                   .on("keyup", function () { outerThis.updateFilterDelayed(); })
                   .on("mouseup", function () { outerThis.updateFilterDelayed(); });
                                      
        this.listDiv = this.containerDiv.append("div")
                                        .attr("id", COMPETITOR_LIST_ID);
                                        
        this.listDiv.on("mousedown", function () { outerThis.startDrag(CONTAINER_COMPETITOR_INDEX); })
                    .on("mousemove", function () { outerThis.mouseMove(CONTAINER_COMPETITOR_INDEX); })
                    .on("mouseup", function () { outerThis.stopDrag(); });
                              
        d3.select(document).on("mouseup", function () { outerThis.stopDrag(); });
    };
    
    /**
    * Returns whether the current mouse event is off the bottom of the list of
    * competitor divs.
    * @return {boolean} True if the mouse is below the last visible div, false
    *     if not.
    */
    CompetitorList.prototype.isMouseOffBottomOfCompetitorList = function () {
        return d3.mouse(this.lastVisibleDiv)[1] >= $(this.lastVisibleDiv).height();
    };
    
    /**
    * Returns the name of the CSS class to apply to competitor divs currently
    * part of the selection/deselection.
    * @return {String} CSS class name;
    */
    CompetitorList.prototype.getDragClassName = function () {
        return (this.inverted) ? "dragDeselected" : "dragSelected";
    };
    
    /**
    * Handles the start of a drag over the list of competitors.
    * @param {Number} index - Index of the competitor div that the drag started
    *     over, or COMPETITOR_CONTAINER_INDEX if below the list of competitors.
    */
    CompetitorList.prototype.startDrag = function (index) {
        if (d3.event.which === LEFT_BUTTON) {
            this.dragStartCompetitorIndex = index;
            this.currentDragCompetitorIndex = index;
            this.allCompetitorDivs = $("div.competitor");
            var visibleDivs = this.allCompetitorDivs.filter(":visible");
            this.lastVisibleDiv = visibleDivs[visibleDivs.length - 1];
            this.inverted = d3.event.shiftKey;
            if (index === CONTAINER_COMPETITOR_INDEX) {
                // Drag not starting on one of the competitors.
                if (!this.isMouseOffBottomOfCompetitorList()) {
                    // User has started the drag in the scrollbar.  Ignore it.
                    return;
                }
            } else {
                d3.select(this.allCompetitorDivs[index]).classed(this.getDragClassName(), true);
            }
            
            d3.event.stopPropagation();
            this.dragging = true;
        }
    };
    
    /**
    * Handles a mouse-move event. by adjust the range of dragged competitors to
    * include the current index.
    * @param {Number} dragIndex - The index to which the drag has now moved.
    */
    CompetitorList.prototype.mouseMove = function (dragIndex) {
        if (this.dragging) {
            d3.event.stopPropagation();
            if (dragIndex !== this.currentDragCompetitorIndex) {
                var dragClassName = this.getDragClassName();
                d3.selectAll("div.competitor." + dragClassName).classed(dragClassName, false);
                
                if (this.dragStartCompetitorIndex === CONTAINER_COMPETITOR_INDEX && dragIndex === CONTAINER_COMPETITOR_INDEX) {
                    // Drag is currently all off the list, so do nothing further.
                    return;
                } else if (dragIndex === CONTAINER_COMPETITOR_INDEX && !this.isMouseOffBottomOfCompetitorList()) {
                    // Drag currently goes onto the div's scrollbar.
                    return;
                }
                
                var leastIndex, greatestIndex;
                if (this.dragStartCompetitorIndex === CONTAINER_COMPETITOR_INDEX || dragIndex === CONTAINER_COMPETITOR_INDEX) {
                    // One of the ends is off the bottom.
                    leastIndex = this.dragStartCompetitorIndex + dragIndex - CONTAINER_COMPETITOR_INDEX;
                    greatestIndex = this.allCompetitorDivs.length - 1;
                } else {
                    leastIndex = Math.min(this.dragStartCompetitorIndex, dragIndex);
                    greatestIndex  = Math.max(this.dragStartCompetitorIndex, dragIndex);
                }
                
                var selectedCompetitors = [];
                for (var index = leastIndex; index <= greatestIndex; index += 1) {
                    if (this.allCompetitorDivs[index].style.display !== "none") {
                        selectedCompetitors.push(this.allCompetitorDivs[index]);
                    }
                }
                
                d3.selectAll(selectedCompetitors).classed(dragClassName, true);
                this.currentDragCompetitorIndex = dragIndex;
            }
        }
    };

    /**
    * Handles the end of a drag in the competitor list.
    */
    CompetitorList.prototype.stopDrag = function () {
        if (!this.dragging) {
            // This handler is wired up to mouseUp on the entire document, in
            // order to cancel the drag if it is let go away from the list.  If
            // we're not dragging then we have a mouse-up after a mouse-down
            // somewhere outside of this competitor list.  Ignore it.
            return;
        }
        
        this.dragging = false;
        
        var selectedCompetitorIndexes = [];
        var dragClassName = this.getDragClassName();
        for (var index = 0; index < this.allCompetitorDivs.size(); index += 1) {
            if ($(this.allCompetitorDivs[index]).hasClass(dragClassName)) {
                selectedCompetitorIndexes.push(index);
            }
        }
        
        d3.selectAll("div.competitor." + dragClassName).classed(dragClassName, false);
        
        if (d3.event.currentTarget === document) {
            // Drag ended outside the list.
        } else if (this.currentDragCompetitorIndex === CONTAINER_COMPETITOR_INDEX && !this.isMouseOffBottomOfCompetitorList()) {
            // Drag ended in the scrollbar.
        } else if (selectedCompetitorIndexes.length === 1) {
            // User clicked, or maybe dragged within the same competitor.
            this.toggleCompetitor(selectedCompetitorIndexes[0]);
        } else if (this.inverted) {
            this.competitorSelection.bulkDeselect(selectedCompetitorIndexes);
        } else {
            this.competitorSelection.bulkSelect(selectedCompetitorIndexes);
        }
        
        this.dragStartCompetitorIndex = null;
        this.currentDragCompetitorIndex = null;
        
        d3.event.stopPropagation();
    };

    /**
    * Returns the width of the list, in pixels.
    * @returns {Number} Width of the list.
    */
    CompetitorList.prototype.width = function () {
        return $(this.listDiv.node()).width();
    };
    
    /**
    * Sets the overall height of the competitor list.
    * @param {Number} height - The height of the control, in pixels.
    */
    CompetitorList.prototype.setHeight = function (height) {
        $(this.listDiv.node()).height(height - $(this.buttonsPanel.node()).height());
    };

    /**
    * Select all of the competitors.
    */
    CompetitorList.prototype.selectAll = function () {
        this.competitorSelection.selectAll();
    };

    /**
    * Select none of the competitors.
    */
    CompetitorList.prototype.selectNone = function () {
        this.competitorSelection.selectNone();
    };
    
    /**
    * Returns whether the competitor with the given index is selected.
    * @param {Number} index - Index of the competitor within the list.
    * @return True if the competitor is selected, false if not.
    */
    CompetitorList.prototype.isSelected = function (index) {
        return this.competitorSelection !== null && this.competitorSelection.isSelected(index);
    };
    
    /**
    * Select all of the competitors that cross the unique selected competitor.
    */
    CompetitorList.prototype.selectCrossingRunners = function () {
        this.competitorSelection.selectCrossingRunners(this.allCompetitors); 
        if (this.competitorSelection.isSingleRunnerSelected()) {
            // Only a single runner is still selected, so nobody crossed the
            // selected runner.
            var competitorName = this.allCompetitors[this.competitorSelection.getSingleRunnerIndex()].name;
            this.alerter(getMessageWithFormatting("RaceGraphNoCrossingRunners", {"$$NAME$$": competitorName}));
        }
    };
    
    /**
    * Enables or disables the crossing-runners button as appropriate.
    */
    CompetitorList.prototype.enableOrDisableCrossingRunnersButton = function () {
        this.crossingRunnersButton.node().disabled = !this.competitorSelection.isSingleRunnerSelected();
    };
    
    /**
    * Sets the chart type, so that the competitor list knows whether to show or
    * hide the Crossing Runners button.
    * @param {Object} chartType - The chart type selected.
    */
    CompetitorList.prototype.setChartType = function (chartType) {
        this.crossingRunnersButton.style("display", (chartType.isRaceGraph) ? "block" : "none");    
    };

    /**
    * Handles a change to the selection of competitors, by highlighting all
    * those selected and unhighlighting all those no longer selected.
    */
    CompetitorList.prototype.selectionChanged = function () {
        var outerThis = this;
        this.listDiv.selectAll("div.competitor")
                    .data(d3.range(this.competitorSelection.count))
                    .classed("selected", function (comp, index) { return outerThis.isSelected(index); });
    };

    /**
    * Toggle the selectedness of a competitor.
    * @param {Number} index - The index of the competitor.
    */
    CompetitorList.prototype.toggleCompetitor = function (index) {
        this.competitorSelection.toggle(index);
    };

    /**
    * 'Normalise' a name or a search string into a common format.
    *
    * This is used before searching: a name matches a search string if the
    * normalised name contains the normalised search string.
    *
    * At present, the normalisations carried out are:
    * * Conversion to lower case
    * * Removing all non-alphanumeric characters.
    *
    * @param {String} name - The name to normalise.
    * @return {String} The normalised names.
    */
    function normaliseName(name) {
        return name.toLowerCase().replace(/\W/g, "");
    }

    /**
    * Sets the list of competitors.
    * @param {Array} competitors - Array of competitor data.
    * @param {boolean} multipleClasses - Whether the list of competitors is
    *      made up from those in multiple classes.
    */
    CompetitorList.prototype.setCompetitorList = function (competitors, multipleClasses) {
        this.allCompetitors = competitors;
        this.normedNames = competitors.map(function (comp) { return normaliseName(comp.name); });
        
        var competitorDivs = this.listDiv.selectAll("div.competitor").data(competitors);

        var outerThis = this;
        competitorDivs.enter().append("div")
                              .classed("competitor", true)
                              .classed("selected", function (comp, index) { return outerThis.isSelected(index); });

        competitorDivs.selectAll("span").remove();
        
        if (multipleClasses) {
            competitorDivs.append("span")
                          .classed("competitorClassLabel", true)
                          .text(function (comp) { return comp.className; });
        }
        
        competitorDivs.append("span")
                      .classed("nonfinisher", function (comp) { return !comp.completed(); })
                      .text(function (comp) { return (comp.completed()) ? comp.name : "* " + comp.name; });

        competitorDivs.exit().remove();
        
        competitorDivs.on("mousedown", function (_datum, index) { outerThis.startDrag(index); })
                      .on("mousemove", function (_datum, index) { outerThis.mouseMove(index); })
                      .on("mouseup", function () { outerThis.stopDrag(); });
    };

    /**
    * Sets the competitor selection object.
    * @param {SplitsBrowser.Controls.CompetitorSelection} selection - Competitor selection.
    */
    CompetitorList.prototype.setSelection = function (selection) {
        if (this.competitorSelection !== null) {
            this.competitorSelection.deregisterChangeHandler(this.handler);
        }

        var outerThis = this;
        this.competitorSelection = selection;
        this.handler = function () { outerThis.selectionChanged(); };
        this.competitorSelection.registerChangeHandler(this.handler);
        this.selectionChanged();
    };
    
    /**
    * Updates the filtering following a change in the filter text input.
    */
    CompetitorList.prototype.updateFilter = function () {
        var currentFilterString = this.filter.node().value;
        if (currentFilterString !== this.lastFilterString) {
            var normedFilter = normaliseName(currentFilterString);
            var outerThis = this;
            this.listDiv.selectAll("div.competitor")
                        .style("display", function (div, index) { return (outerThis.normedNames[index].indexOf(normedFilter) >= 0) ? null : "none"; });
            
            this.lastFilterString = currentFilterString;
        }
    };
    
    /**
    * Updates the filtering following a change in the filter text input
    * in a short whiie.
    */
    CompetitorList.prototype.updateFilterDelayed = function () {
        var outerThis = this;
        setTimeout(function () { outerThis.updateFilter(); }, 1);
    };
    
    SplitsBrowser.Controls.CompetitorList = CompetitorList;
})();