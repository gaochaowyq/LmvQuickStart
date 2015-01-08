/**
 * Created by awej on 7/21/14.
 */

/*****
Copyright (c) 2014 by JArpit (http://jsbin.com/enaqib/10/edit)
Released under the MIT license: http://jsbin.mit-license.org

NOTE:  originally copied from above source, but since modified by Jim Awe, Autodesk Inc.
*******/

function startRead(evt) {
    var file = document.getElementById("ui_filePicker").files[0];
    if (file) {
        /*
        else {
            getAsText(file);
            alert("Name: "+file.name +"\n"+"Last Modified Date :"+file.lastModifiedDate);
        }*/
        getAsBinary(file);
    }

    evt.stopPropagation();
    evt.preventDefault();
}

function startReadFromDrag(evt) {
    var file = evt.dataTransfer.files[0];
    if (file) {
        /*
        else {
            getAsText(file);
            alert("Name: " + file.name + "\n" + "Last Modified Date :" + file.lastModifiedDate);
        }*/
        getAsBinary(file);
    }
    evt.stopPropagation();
    evt.preventDefault();
}


function getAsText(readFile) {

    var reader = new FileReader();

    // Read file into memory as UTF-16
    reader.readAsText(readFile, "UTF-8");

    // Handle progress, success, and errors
    reader.onprogress = updateProgress;
    reader.onload = loaded;
    reader.onerror = errorHandler;
}

function getAsBinary(readFile) {

    var reader = new FileReader();

   // reader.readAsBinaryString(readFile);
    
    var blob = readFile.slice(0, readFile.size);
    reader.readAsArrayBuffer (blob);

    // Handle progress, success, and errors
    reader.onprogress = updateProgress;
    reader.onload = loaded;
    reader.onerror = errorHandler;
}


function updateProgress(evt) {
    if (evt.lengthComputable) {
        // evt.loaded and evt.total are ProgressEvent properties
        var loaded = (evt.loaded / evt.total);

        if (loaded < 1) {
            $("#txt_fileLoadStatus").text("Reading File: " + loaded);
        }
    }
}

function loaded(evt) {
        // Obtain the read file data
    _fileUploadData = evt.target.result;

    //alert("file Loaded successfully");
    $("#txt_fileLoadStatus").text("File Read Successfully");
    $("#bn_uplaodFile").removeAttr("disabled");
}

function errorHandler(evt) {
    if (evt.target.error.name == "NotReadableError") {
        // The file could not be read
    }
    $("#txt_fileLoadStatus").text("Could Not Read File");
}

function domagic(evt){
    $("#draghere").css("background-color","green");
    evt.stopPropagation();
    evt.preventDefault();
}

