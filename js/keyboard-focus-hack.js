/**
 * This method prevents the Google Earth Plugin from getting keyboard focus
 * by perpetually reassigning the DOMWindow focus. Elements in the page
 * aren't affected and when the window gets onfocus/onblur events, this
 * is enabled/disabled.
 *
 * NOTE: Only works in Firefox currently. Fails gracefully in other
 * browsers.
 */
function keyboardFocusHack(ge) {
  // first turn off mouse navigation
  ge.getOptions().setMouseNavigationEnabled(false);
  
  if (navigator.userAgent.indexOf('Firefox') < 0)
    return;
  
  // event handling helper
  function addEventHandler(obj, evt, handler) {
    if ('attachEvent' in obj)
      obj.attachEvent('on' + evt, handler);
    else
      obj.addEventListener(evt, handler, false);
  }

  // set up force window focus
  var forceFocusInterval = null;

  function turnForceFocusOff() {
    if (forceFocusInterval)
      clearInterval(forceFocusInterval);
    
    forceFocusInterval = null;
  }

  function turnForceFocusOn() {
    turnForceFocusOff();
    forceFocusInterval = setInterval(function() {
      if (forceFocusInterval)
        window.focus();
    }, 200);
  }

  turnForceFocusOn();
  addEventHandler(window, 'focus', turnForceFocusOn);
  addEventHandler(window, 'blur',  turnForceFocusOff);
  
  // prevent page scrolling with up/down and page up/page down arrows
  addEventHandler(window, 'keydown', function(evt) {
    // TODO: only for arrow keys!
    if ((37 <= evt.keyCode && evt.keyCode <= 40) || // arrow keys
        (33 <= evt.keyCode && evt.keyCode <= 34)) { // page up/down
      evt.preventDefault();
      evt.stopPropagation();
    }
  });
};
