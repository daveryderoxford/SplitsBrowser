﻿/*
 *  SplitsBrowser CSV - Reads in CSV result data files.
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
(function () {
    "use strict";
    
    var isTrue = SplitsBrowser.isTrue;
    var throwInvalidData = SplitsBrowser.throwInvalidData;
    var throwWrongFileFormat = SplitsBrowser.throwWrongFileFormat;
    var normaliseLineEndings = SplitsBrowser.normaliseLineEndings;
    var parseTime = SplitsBrowser.parseTime;
    var Competitor = SplitsBrowser.Model.Competitor;
    var compareCompetitors = SplitsBrowser.Model.compareCompetitors;
    var CourseClass = SplitsBrowser.Model.CourseClass;
    var Course = SplitsBrowser.Model.Course;
    var Event = SplitsBrowser.Model.Event;

    /**
    * Parse a row of competitor data.
    * @param {Number} index - Index of the competitor line.
    * @param {string} line - The line of competitor data read from a CSV file.
    * @param {Number} controlCount - The number of controls (not including the finish).
    * @return {Object} Competitor object representing the competitor data read in.
    */
    function parseCompetitors(index, line, controlCount) {
        // Expect forename, surname, club, start time then (controlCount + 1) split times in the form MM:SS.
        var parts = line.split(",");
        if (parts.length === controlCount + 5) {
            var forename = parts.shift();
            var surname = parts.shift();
            var club = parts.shift();
            var startTimeStr = parts.shift();
            var startTime = parseTime(startTimeStr);
            if (!startTimeStr.match(/^\d+:\d\d:\d\d$/)) {
                // Start time given in hours and minutes instead of hours,
                // minutes and seconds.
                startTime *= 60;
            }
            
            var splitTimes = parts.map(parseTime);
            return Competitor.fromSplitTimes(index + 1, forename + " " + surname, club, startTime, splitTimes);
        } else {
            throwInvalidData("Expected " + (controlCount + 5) + " items in row for competitor in class with " + controlCount + " controls, got " + (parts.length) + " instead.");
        }
    }

    /**
    * Parse CSV data for a class.
    * @param {string} courseClass - The string containing data for that class.
    * @return {SplitsBrowser.Model.CourseClass} Parsed class data.
    */
    function parseCourseClass (courseClass) {
        var lines = courseClass.split(/\r?\n/).filter(isTrue);
        if (lines.length === 0) {
            throwInvalidData("parseCourseClass got an empty list of lines");
        }

        var firstLineParts = lines.shift().split(",");
        if (firstLineParts.length === 2) {
            var className = firstLineParts.shift();
            var controlCountStr = firstLineParts.shift();
            var controlCount = parseInt(controlCountStr, 10);
            if (isNaN(controlCount)) {
                throwInvalidData("Could not read control count: '" + controlCountStr + "'");
            } else if (controlCount < 0) {
                throwInvalidData("Expected a positive control count, got " + controlCount + " instead");
            } else {
                var competitors = lines.map(function (line, index) { return parseCompetitors(index, line, controlCount); });
                competitors.sort(compareCompetitors);
                return new CourseClass(className, controlCount, competitors);
            }
        } else {
            throwWrongFileFormat("Expected first line to have two parts (class name and number of controls), got " + firstLineParts.length + " part(s) instead");
        }
    }

    /**
    * Parse CSV data for an entire event.
    * @param {string} eventData - String containing the entire event data.
    * @return {SplitsBrowser.Model.Event} All event data read in.
    */
    function parseEventData (eventData) {

        eventData = normaliseLineEndings(eventData);
        
        // Remove trailing commas.
        eventData = eventData.replace(/,+\n/g, "\n").replace(/,+$/, "");

        var classSections = eventData.split(/\n\n/).map($.trim).filter(isTrue);
       
        var classes = classSections.map(parseCourseClass);
        
        classes = classes.filter(function (courseClass) { return !courseClass.isEmpty(); });
        
        if (classes.length === 0) {
            throwInvalidData("No competitor data was found");
        }
        
        // Nulls are for the course length, climb and controls, which aren't in
        // the source data files, so we can't do anything about them.
        var courses = classes.map(function (cls) { return new Course(cls.name, [cls], null, null, null); });
        
        for (var i = 0; i < classes.length; i += 1) {
            classes[i].setCourse(courses[i]);
        }
        
        return new Event(classes, courses);
    }
    
    SplitsBrowser.Input.CSV = { parseEventData: parseEventData };
})();
