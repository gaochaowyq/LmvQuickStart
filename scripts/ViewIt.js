var _viewer = null;     // global variable for the viewer
var _views2D = null;    // the 2D views in the bubble
var _views3D = null;    // the 3D views in the bubble
var _loadedDocument = null;

$(document).ready(function() {

        // view it
    $("#form_fileToView").submit(function(evt) {
        evt.preventDefault();

        var urnStr = evt.target.urn.value;
         if (!urnStr || (0 === urnStr.length)) {
            alert("You must specify a URN!");
            return;
        }

            // if we already have something loaded, uninitialize and re-init
        if (_viewer != null) {
            _viewer.uninitialize();
            _viewer = null;
        }

        loadModel(urnStr);
    });
});

    // populate the popup menu with the avaialable views to load (from the array above)
function loadViewMenuOptions() {
    var sel = $("#pu_viewToLoad");
    
    sel.removeAttr("disabled"); // no longer disabled if we loaded a model

    sel.find("option").remove().end();  // remove all existing options
    
            // add the 3D options
    $.each(_views3D, function(i, item) {
        sel.append($("<option>", { 
            value: i,
            text : item.name 
        }));
    });
    
    sel.append($("<option disabled>─────────────────</option>"));    // add a separator
    
        // add the 2D options
    $.each(_views2D, function(i, item) {
        sel.append($("<option>", { 
            value: i + 1000,    // make 2D views have a value greater than 1000 so we can tell from 3D
            text : item.name 
        }));
    });
}

    // user selected a new view to load
 $("#pu_viewToLoad").change(function(evt) {  
    evt.preventDefault();
     
    var index = parseInt($("#pu_viewToLoad option:selected").val(), 10);
     
    if (index >= 1000) {    // 2D views we gave a higher index to in the Popup menu
        index -= 1000;
        console.log("Changing to 2D view: " + _views2D[index].name);
        initializeViewer();
        loadView(_views2D[index]);
    }
    else {
        console.log("Changing to 3D view: " + _views3D[index].name);
        initializeViewer();
        loadView(_views3D[index]);
    }
});

    
    // initialize the viewer into the HTML placeholder
function initializeViewer() {
    
        // if we already have something loaded, uninitialize and re-init (can't just load a new file!:  ?? is that a bug?)
    if (_viewer !== null) {
        _viewer.uninitialize();
        _viewer = null;
    }

    var viewerElement = document.getElementById("viewer");  // placeholder in HTML to stick the viewer
        
    _viewer = new Autodesk.Viewing.Private.GuiViewer3D(viewerElement, {});
   
    var retCode = _viewer.initialize();
    if (retCode !== 0) {
        alert("ERROR: Couldn't initialize viewer!");
        console.log("ERROR Code: " + retCode);      // TBD: do real error handling here
    }
}

    // load a specific document into the intialized viewer
function loadDocument(urnStr) {
    
    _loadedDocument = null; // reset to null if reloading

    if (!urnStr || (0 === urnStr.length)) {
        alert("You must specify a URN!");
        return;
    }
    var fullUrnStr = "urn:" + urnStr;
    
    Autodesk.Viewing.Document.load(fullUrnStr, function(document) {        
        _loadedDocument = document; // keep this in a global var so we can reference it in other spots

            // get all the 3D and 2D views (but keep in separate arrays so we can differentiate in the UX)
        _views3D = Autodesk.Viewing.Document.getSubItemsWithProperties(document.getRootItem(), {'type':'geometry', 'role':'3d'}, true);
        _views2D = Autodesk.Viewing.Document.getSubItemsWithProperties(document.getRootItem(), {'type':'geometry', 'role':'2d'}, true);
        
        loadViewMenuOptions();                   // populate UX with views we just retrieved
        initializeViewer();
        
            // load up first 3D view by default
        if (_views3D.length > 0) {
            loadView(_views3D[0]);   
        }
        else if (_views2D.length > 0) {
            loadView(_views2D[0]);  
        }
        else {
            assert("ERROR: Can't find any Views in the current model!");
        }
        
    }, function(errorCode, errorMsg) {
        alert('Load Error: ' + errorMsg);
    });
}

    // for now, just simple diagnostic functions to make sure we know what is happing
function loadViewSuccessFunc()
{
    console.log("Loaded viewer successfully with given asset...");
}

function loadViewErrorFunc()
{
    console.log("ERROR: could not load asset into viewer...");
}

    // load a particular viewable into the viewer
function loadView(viewObj) {
    var path = _loadedDocument.getViewablePath(viewObj);
    console.log("Loading view URN: " + path);
    _viewer.load(path, _loadedDocument.getPropertyDbPath(), loadViewSuccessFunc, loadViewErrorFunc);
}

    // wrap this in a simple function so we can pass it into the Initializer options object
function getAccessToken() {
    return _myAuthToken.value();
}

    // called when "View It" button is pressed, try to load the URN that was specified by the user
function loadModel(urnToModel) {    
    var options = {};
    options.env = _viewerEnv;                // AutodeskProduction, AutodeskStaging, or AutodeskDevelopment (set in global var in this project)
    options.getAccessToken = getAccessToken;
    options.refreshToken   = getAccessToken;
    
    Autodesk.Viewing.Initializer(options, function() {
        loadDocument(urnToModel);
    });
}

