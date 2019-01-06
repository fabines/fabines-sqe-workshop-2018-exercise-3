import $ from 'jquery';
import {parseCode,runParser} from './code-analyzer';
import * as viz from 'viz.js';



$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let args = $('#args').val();
        let parsedCode = parseCode(codeToParse);
        $('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
        let graph = runParser(codeToParse,args);
        document.getElementById('graph').innerHTML = viz('digraph{'+ graph +'}');



    });
});

