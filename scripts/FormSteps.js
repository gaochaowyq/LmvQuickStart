var _fileUploadData = null;     // global variable to store the data uploaded from the file
var _spinner = null;

    // allow our code to switch between different environments easily
var _viewingSvcEnv = "PROD";     // PROD, STG, DEV
var _baseURL = "";
if (_viewingSvcEnv === "PROD") {
    _baseURL = "https://developer.api.autodesk.com";
    _viewerEnv = "AutodeskProduction";
}
else if (_viewingSvcEnv === "STG") {
    _baseURL = "https://developer-stg.api.autodesk.com";
    _viewerEnv = "AutodeskStaging";
}
else if (_viewingSvcEnv === "DEV") {
    _baseURL = "https://developer.api.autodesk.com";
    _viewerEnv = "AutodeskDevelopment";
}
else {
    alert("DEVELOPER ERROR: Set Environment to a valid state!");
}

console.log("Enviornment: " + _viewingSvcEnv + " " + _baseURL + " " + _viewerEnv);

    // helper object to get us our AuthToken based on our developer keys
var _myAuthToken = new MyAuthToken(_viewingSvcEnv);
_myAuthToken.setManualAuthToken("");
//_myAuthToken.get();


    // start a UI spinner to indicate to the user that an async call is in progress
function startSpinner(divId) {
    var target = document.getElementById(divId);

    if (_spinner === null) {
        _spinner = new Spinner();
    }
    _spinner.spin(target);
}

    // stop the spinner when async call is complete
function stopSpinner() {
    if (_spinner !== null)
        _spinner.stop();
}

$(document).ready(function() {
    
        // try it
    $("#formTryLive").submit(function(evt) {
        evt.preventDefault();
        
        window.open("./liveSample.html", '_blank');
    });
    
        // sign up
    $("#form_signUp").submit(function(evt) {
        evt.preventDefault();
        
        window.open("https://developer.autodesk.com", '_blank');
    });
    
        // enable/disable controls appropriately when choosing different options for Authentication
    $("#cb_useCustomeAuthTokenSvc").change(function() {
        var urlElem = $("#eb_urlAuthTokenService");
        var tokenElem = $("#eb_authToken");
        var buttonElem = $("#bn_authenticate");
        
        if ($(this).is(":checked")) {
            urlElem.removeAttr('disabled');
            urlElem.val("");
            tokenElem.attr('disabled','disabled');
            buttonElem.html("Authenticate");
        }
        else {
            urlElem.attr('disabled','disabled');
            urlElem.val("** using manually generated AuthToken **");
            tokenElem.removeAttr('disabled');
            buttonElem.html("Use AuthToken");
        }
    });
    
    $("#eb_urlAuthTokenService").val("** using manually generated AuthToken **");

        // get a current access token
    $("#form_getAccessToken").submit(function(evt) {
        evt.preventDefault();
        $("#txt_resAuthenticate").html("");  // blank out any previous results
        
        if ($("#cb_useCustomeAuthTokenSvc").is(":checked")) {
            if (evt.target.urlAuthTokenService.value)
                _myAuthToken.setCustomTokenServiceUrl(evt.target.urlAuthTokenService.value);
            else {
                alert("No custom AuthToken Service URL specified!");
                return;   
            }
        }
        else {
            if (evt.target.authToken.value)
                _myAuthToken.setManualAuthToken(evt.target.authToken.value);
            else {
                alert("No manually generated AuthToken specified!");
                return;
            }
        }
            // now call get() to retrieve the AuthToken, which will then be valid for a certain amount
            // of time.  No need to change this value again unless you want to change to a different 
            // AuthTokenService.
        $("#txt_resAuthenticate").html(JSON.stringify(_myAuthToken.get(), null, '   '));
    });
    
        // get a list of supported file format types for translation
    $("#form_getFormats").submit(function(evt) {
        evt.preventDefault();
        
        $("#txt_resGetSupportedFormats").html("");  // blank out any previous results
        
        var jqxhr = $.ajax({
            url: _baseURL + '/viewingservice/v1/supported',
            type: 'GET',
            headers: {
                "Authorization": "Bearer " + _myAuthToken.value()
            },
            beforeSend: startSpinner("spn_getFormats")
        })
        .done(function(ajax_data) {
            $("#txt_resGetSupportedFormats").html(JSON.stringify(ajax_data, null, '   '));
            stopSpinner();
        })
        .fail(function(jqXHR, textStatus) {
            $("#txt_resGetSupportedFormats").html(ajaxErrorStr(jqXHR));
            stopSpinner();
        });
    });
    

        // create a new Bucket
    $("#form_createBucket").submit(function(evt) {
         evt.preventDefault();
        
        $("#txt_resCreateBucket").html("");  // blank out any previous results
        
        var policyStr = evt.target.policy.options[evt.target.policy.selectedIndex].text;
        
        if (_myAuthToken.isDefault && (policyStr === "persistent")) {
            alert("You are not allowed to create a Persistent bucket while using the default Auth Token Service. (See Step 3 above)");
            return;
        }
        
            // NOTE: args to REST API are extremely sensitive to JSON data.
            // Only way I found that works is to create an object first and then
            // "stringify" it instead of letting jQuery deal with it as normal.
        var dataObj = {
            bucketKey : evt.target.bucketName.value,
            policy : policyStr
        };
        var dataStr = JSON.stringify(dataObj);
                
        var jqxhr = $.ajax({
            url: _baseURL + '/oss/v1/buckets',
            type: 'POST',
            headers: {
                "Authorization": "Bearer " + _myAuthToken.value()
            },
            data: dataStr,
            dataType: 'json',
            contentType: 'application/json',
            beforeSend: startSpinner("spn_createBucket")
        })
        .done(function(ajax_data) {
            $("#txt_resCreateBucket").html(JSON.stringify(ajax_data, null, '   '));
            stopSpinner();
        })
        .fail(function(jqXHR, textStatus) {
            $("#txt_resCreateBucket").html(ajaxErrorStr(jqXHR));
            stopSpinner();
        });
    });


        // get an existing Bucket
        // NOTE: If the bucketName is correct, it will return the correct results.  But, if you do not specify
        // a valid bucketName, it returns a 404 to the browser console, but I can't seem to get the right error
        // to return to jQuery.
    $("#form_getBucketDetails").submit(function(evt) {
        evt.preventDefault();
        
        $("#txt_resGetBucketDetails").html("");  // blank out any previous results
        
        var urlStr = _baseURL + '/oss/v1/buckets/' + evt.target.bucketName.value + '/details';
        var jqxhr = $.ajax({
            url: urlStr,
            type: 'GET',
            headers: {
                "Authorization": "Bearer " + _myAuthToken.value()
            },
            beforeSend: startSpinner("spn_getBucket")
        })
        .done(function(ajax_data) {
            $("#txt_resGetBucketDetails").html(JSON.stringify(ajax_data, null, '   '));
            stopSpinner();
        })
        .fail(function(jqXHR, textStatus) {
            $("#txt_resGetBucketDetails").html(ajaxErrorStr(jqXHR));
            stopSpinner();
        });
    });

        // upload a file to the given bucket
    $("#form_uploadFile").submit(function(evt) {
        evt.preventDefault();
        
            // make sure they specified a bucketName
        var bucketNameStr = evt.target.bucketName.value;
        if (!bucketNameStr || (0 === bucketNameStr.length)) {
            alert("You must specify an bucket name!");
            return;
        }
            
        $("#txt_resUploadFile").html("");  // blank out any previous results
        
            // make sure we can get the file
        var fileObj = $('#ui_filePicker')[0].files[0];
        if (!fileObj) {
            alert("ERROR: Could not retrieve file for upload.");
            return;
        }

        var urlStr = _baseURL + '/oss/v1/buckets/'  + bucketNameStr + '/objects/' + fileObj.name;
        var jqxhr = $.ajax({
            url: urlStr,
            type: 'PUT',
            headers: {
                "Authorization": "Bearer " + _myAuthToken.value(),
                "Content-Type": 'application/stream'
            },
            data: _fileUploadData,      // global var set by FileUploader.js in the "loaded(evt)" function
            processData: false,
            beforeSend: startSpinner("spn_uploadFile")
        })
        .done(function(ajax_data) {
            $("#txt_resUploadFile").html(JSON.stringify(ajax_data, null, '   '));
            stopSpinner();
        })
        .fail(function(jqXHR, textStatus) {
            $("#txt_resUploadFile").html(ajaxErrorStr(jqXHR));
            stopSpinner();
        });
    });

        // get the details of an object in a bucket
    $("#form_getObj").submit(function(evt) {
        evt.preventDefault();
        
        $("#txt_resGetObj").html("");  // blank out any previous results
        
        var urlStr = _baseURL + '/oss/v1/buckets/' + evt.target.bucketName.value +
                            '/objects/' + evt.target.objKey.value + '/details';
        var jqxhr = $.ajax({
            url: urlStr,
            type: 'GET',
            headers: {
                "Authorization": "Bearer " + _myAuthToken.value()
            },
            beforeSend: startSpinner("spn_getObj")
        })
        .done(function(ajax_data) {
            $("#txt_resGetObj").html(JSON.stringify(ajax_data, null, '   '));
            stopSpinner();
        })
        .fail(function(jqXHR, textStatus) {
            $("#txt_resGetObj").html(ajaxErrorStr(jqXHR));
            stopSpinner();
        });
    });
    
    
        // set References
    $("#form_setReferences").submit(function(evt) {
        evt.preventDefault();
        
            // Here is sample code hardwired to do one Host file with one Xref
        /*var dataObj = {
            master : "urn:adsk.objects:os.object:MYBUCKET/ROOT_FILE.xyz",
            dependencies : [
              { file : "urn:adsk.objects:os.object:MYBUCKET/LINKED_FILE.xyz",
                metadata : {
                    childPath : "LINKED_FILE.xyz",
                    parentPath : "ROOT_FILE.xyz"
                }
              }
              ]
        };*/
        
            // here we are reading the JSON in from the form
        var dataObj = null;
        try {
            var textStr = $("#txt_sampleSetRefs").val();
            dataObj = JSON.parse(textStr);
        } catch (error) {
            alert("JSON parsing error: \n" + error.message);
        }
        if (!dataObj)
            return;
                
        var dataStr = JSON.stringify(dataObj);
                
        $("#txt_resSetRefs").html("");  // blank out any previous results
        
        var urlStr = _baseURL + '/references/v1/setreference';
        var jqxhr = $.ajax({
            url: urlStr,
            type: 'POST',
            headers: {
                "Authorization": "Bearer " + _myAuthToken.value()
            },
            data: dataStr,
            //dataType: 'json',
            contentType: 'application/json',
            beforeSend: startSpinner("spn_setRefs")
        })
        .done(function(ajax_data) {
            $("#txt_resSetRefs").html(JSON.stringify(ajax_data, null, '   '));
            stopSpinner();
        })
        .fail(function(jqXHR, textStatus) {
            $("#txt_resSetRefs").html(ajaxErrorStr(jqXHR, textStatus));
            stopSpinner();
        });
    });


        // encode the given URN to one that is accepted by the translation service
    $("#form_urnToEncode").submit(function(evt) {
        evt.preventDefault();
        
        $("#txt_resEncode64").html("");  // blank out any previous results
        
        var str = Base64.encode(evt.target.urn.value);
        $("#txt_resEncode64").val(str);
    });
    
        // view status the file
    $("#form_viewTranslateStatus").submit(function(evt) {
        evt.preventDefault();
        
        $("#txt_resViewTranslateStatus").html("");  // blank out any previous results
        
        var urnStr = evt.target.urn.value;
         if (!urnStr || (0 === urnStr.length)) {
            alert("You must specify a URN!");
            return;
        }
        
        var includeAll = $("#cb_viewStatusAll").is(":checked");
        
        var urlStr = _baseURL + '/viewingservice/v1/' + urnStr;
        if (includeAll)
            urlStr += "/all";
        
        var jqxhr = $.ajax({
            url: urlStr,
            type: 'GET',
            headers: {
                "Authorization": "Bearer " + _myAuthToken.value()
            },
            beforeSend: startSpinner("spn_viewTranslationStatus")
        })
        .done(function(ajax_data) {
            $("#txt_resViewTranslateStatus").html(JSON.stringify(ajax_data, null, '   '));
            stopSpinner();
        })
        .fail(function(jqXHR, textStatus) {
            $("#txt_resViewTranslateStatus").html(ajaxErrorStr(jqXHR));
            stopSpinner();
        });
    });
    
        // translate the file
    $("#form_translateFile").submit(function(evt) {
        evt.preventDefault();
        
        $("#txt_resTranslate").html("");  // blank out any previous results
        
        var urnStr = evt.target.urn.value;
         if (!urnStr || (0 === urnStr.length)) {
            alert("You must specify a URN!");
            return;
        }

        var dataObj = {
            urn : urnStr
        };
        var dataStr = JSON.stringify(dataObj);
        
        var urlStr = _baseURL + '/viewingservice/v1/register';
        var jqxhr = $.ajax({
            url: urlStr,
            type: 'POST',
            headers: {
                "Authorization": "Bearer " + _myAuthToken.value()
            },
            data: dataStr,
            contentType: 'application/json',
            beforeSend: startSpinner("spn_translateFile")
        })
        .done(function(ajax_data) {
            $("#txt_resTranslate").html(JSON.stringify(ajax_data, null, '   '));
            stopSpinner();
        })
        .fail(function(jqXHR, textStatus) {
            $("#txt_resTranslate").html(ajaxErrorStr(jqXHR));
            stopSpinner();
        });
    });

});
