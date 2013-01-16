control = {
    
    storyKey: [],   //  list of current stories
    storyDict: {},  //  dict of current story objects

    storyKeyLong: [],   //  longer list to track recent stories
    storyDictLong: {},  //  to stop flip-flopping as latest stories shuffle around

    rejectThese: '-better-business,-government-computing-network,-social-enterprise-network,-travel/offers,-guardian-professional,-public-leaders-network,-healthcare-network,-teacher-network,-social-care-network,-higher-education-network,-global-development-professionals-network,-housing-network,-culture-professionals-network,-voluntary-sector-network,-small-business-network,-eyewitness-subscriber',    //  a list of sections to reject because
                        //  they're not really "news"

    initialFetch: true, //  We need to display things differently when we get the
                        //  results back for the first time.

    updateTmr: null,


    init: function() {
        this.fetchContent();
    },

    fetchContent: function() {

        //  go and get the latest stories from the guardian
        $.getJSON('http://content.guardianapis.com/search?page-size=20&section=' + this.rejectThese + '&show-fields=lastModified,headline,byline&format=json&callback=?')
        .success(
            function(json) {

                if (control.initialFetch) {
                    control.initialDisplay(json.response.results);
                    control.initialFetch = false;
                    control.updateTmr = setInterval(function() {
                        control.fetchContent();
                    }, 1000 * 60);
                } else {
                    control.updateDisplay(json.response.results);
                }
            }
        );

    },

    initialDisplay: function(stories) {

        for (var i in stories) {
            this.storyKey.push(stories[i].id);
            this.storyDict[stories[i].id] =  true;
            this.storyKeyLong.push(stories[i].id);
            this.storyDictLong[stories[i].id] =  true;
            $('.container ol').append(this.makeUnit(stories[i]));
        }

    },

    updateDisplay: function(stories) {

        //  Now we go thru them finding out if we already have
        //  the story, if we do then we just update the
        //  time
        var timeText = '';
        var l = null;

        utils.log('In updateDisplay');

        for (var i in stories) {
            
            //  already have the story
            if (stories[i].id in this.storyDict) {
                timeText = this.belowText(stories[i]);
                $('#' + stories[i].id.replace(/\//g, '') + ' .date').text(timeText);
            } else {

                utils.log('Not in short story dict');

                //  if we don't already have it in the longer store
                if (!(stories[i].id in this.storyDictLong)) {

                    utils.log('Not in long story dict');

                    //  add the new story at the top.
                    //  and add the ids to the storylist things
                    l = this.makeUnit(stories[i]);
                    l.css('display', 'none');
                    $('ol').prepend(l);
                    l.slideDown('slow');

                    //  Add the into the stores
                    this.storyKey.unshift(stories[i].id);
                    this.storyDict[stories[i].id] =  true;
                    this.storyKeyLong.unshift(stories[i].id);
                    this.storyDictLong[stories[i].id] =  true;

                }

            }

        }

        //  Now trim off anything over 20 items
        //  and remove them from the display
        var remove = null;
        while (this.storyKey.length > 20) {
            utils.log('trimming off bottom story');
            remove = this.storyKey.pop();
            delete this.storyDict[remove];
            $('#' + remove.replace(/\//g, '')).remove();
        }

        //  Trim off anything over 50 items on
        //  the longer list
        while (this.storyKeyLong.length > 100) {
            remove = this.storyKeyLong.pop();
            delete this.storyDictLong[remove];
        }

    },

    makeUnit: function(data) {

        var headline = data.webTitle;
        if ('fields' in data && 'headline' in data.fields) {
            headline = data.fields.headline;
        }

        var l = $('<li>')
        .append(
            $('<a>')
            .attr('href', data.webUrl)
            .append(
                $('<h1>')
                .html(headline)
            )
        )
        .append(
            $('<div>')
            .addClass('section')
            .html('(' + data.sectionName + ')')
        )
        .attr('id', data.id.replace(/\//g, ''));

        //  Now we need to work out how long ago it was created
        //  and if it's back in the list because it's been modified
        var timeText = this.belowText(data);

        l.append($('<div>')
            .addClass('date')
            .html(timeText)
        );

        return l;
    },

    belowText: function(data) {

        var pubTimeAgo = Math.ceil((new Date() - new Date(data.webPublicationDate))/1000/60);
        var modTimeAgo = pubTimeAgo;
        if ('fields' in data && 'lastModified' in data.fields) {
            modTimeAgo = Math.ceil((new Date() - new Date(data.fields.lastModified))/1000/60);
        }

        var timeText = '';
        if (Math.abs(pubTimeAgo - modTimeAgo > 1)) {
            timeText = 'Last modified ' + this.niceTime(modTimeAgo);
        } else {
            timeText = 'Published ' + this.niceTime(pubTimeAgo);
        }

        if ('fields' in data && 'byline' in data.fields) {
            timeText += ' by ' + data.fields.byline;
        }
        timeText += '.';

        return timeText;
    },

    niceTime: function(minutes) {

        if (minutes <= 90) {
            if (minutes == 1) {
                return 'about a minute ago';
            } else {
                return 'about ' + minutes + ' minutes ago';
            }
        } else {
            var hours = Math.floor(minutes/60);
            if (hours == 1) {
                return 'about an hour ago';
            } else {
                return 'about ' + hours + ' hours ago';
            }
        }
        return minutes;
    }

};


// time ago = (new Date() - new Date(t))/1000/60

utils = {
    
    log: function(msg) {

        try {
            console.log(msg);
        } catch(er) {
            //  Nowt
        }
    }

};