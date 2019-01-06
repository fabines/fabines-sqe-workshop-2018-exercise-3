import * as esprima from 'esprima';
const esgraph = require('esgraph');
import * as escodegen from 'escodegen';

const revertcode = (code)=>{
    return escodegen.generate(code);
};

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse);
};
let argsStr = '';
let func_params = [];
function assignParams(functionDeclaration,args) {
    if(args) {
        let {params} = functionDeclaration;
        params = params.map((param) => param.name);
        for (let i = 0; i < params.length; i++) {
            func_params[i] = {name: params[i], val: ''};
        }
        parseArgs(args);
        paramList(args);
    }
}

function parseArgs(args) {
    if (args) {
        args = args.split(',');
        loopArgs(args);
    }
}
function loopArgs(args){
    let counter = 0;
    let inArray = false;
    for (let i = 0; loop_test(i,counter,args); i++) {
        if(args[i].charAt(0)==='['){
            inArray=true;
            func_params[counter].val= [convertValue(args[i].substring(1))];
        } else if(args[i].charAt(args[i].length-1)===']'){
            func_params[counter].val.push(convertValue(args[i].substring(0,args[i].length-1)));
            inArray=false;
            counter++;
        }else if(inArray){
            func_params[counter].val.push(convertValue(args[i]));
        }else{
            func_params[counter++].val= convertValue(args[i]);}
    }
}
function loop_test(i,counter,args){
    return i < args.length && counter < func_params.length;
}
function paramList(args){
    const params = [];
    if(args) {
        func_params.forEach((param) => {
            let exp = 'var ' + param.name + '=' + param.val + ';';
            if (param.val.toString().includes(',')) {
                exp = 'var ' + param.name + '=[' + param.val + '];';
            }
            params.push(exp);
        });
        func_params = params;
    }
    func_params = params;
}
function convertValue(val){
    const stringIndicators = ['\'','"'];
    if(stringIndicators.includes(val.charAt(0))){
        val = '\''+val.substr(1,val.length-2)+'\'';
    }else if(parseFloat(val)){
        val=parseFloat(val);
    }
    return val;
}
function parseToGraph(nodes){
    let counter = 0;
    nodes.forEach((node) => {
        node.id = ++counter;
        node.label = node.id + ' : ' + addToCodeGraph(node.astNode);
        const {parent} = node;
        if(parent.type === 'WhileStatement') {
            node.shape = 'diamond';
        }
        if(parent.type === 'IfStatement') {
            node.shape = 'diamond';
        }
        if(['VariableDeclaration','AssignmentExpression','UpdateExpression','ReturnStatement'].includes(node.astNode.type)){
            node.shape = 'box';
        }
    });
    return nodes;
}
function addToCodeGraph(codeLine = {}) {
    if (codeLine.type === 'VariableDeclaration') {
        return revertcode(codeLine.declarations[0]);
    }
    if (['AssignmentExpression', 'BinaryExpression', 'literal', 'UnaryExpression','UpdateExpression'].includes(codeLine.type)){
        return revertcode(codeLine);
    }
    if(codeLine.type ==='ReturnStatement') {
        return 'return ' + revertcode(codeLine.argument);
    }
    return '';
}
function runParser(code,args) {
    func_params = [];
    let parsedCode = parseCode(code);
    argsStr=args;
    assignParams(parsedCode.body[0],args);//takes the function declaration from esprima
    const cfg = esgraph(parsedCode.body[0].body, {loc: true, range: true});
    cfg[2].pop();
    cfg[2].shift();
    cfg[2] = parseToGraph(cfg[2]);
    const graph = fillGreenPath(dot(cfg,{ counter: 1, source: code }));
    //traverse(hoist(parsedCode));

    return graph;
}
function fillGreenPath(graph){
    const graphLines = graph.split('\n');
    const edges = [];
    const nodes = {};
    graphLines.forEach((line) => {
        if(line.includes('->')) {
            const edgeParts = line.split(' ');
            edges.push({from: nodes[edgeParts[0]], to: nodes[edgeParts[2]]});
        }
        else{
            const nodeParts = line.split(' ');
            nodes[nodeParts[0]] = {
                expression: getNodeExpression(line),
                condition: line.indexOf('diamond') > -1
            };
        }
    });
    AddGreenPath(edges);
    return adjustGraphColor(graph, nodes);
}
function adjustGraphColor(graph, nodes){
    const graphLines =  graph.split('\n');
    Object.values(nodes).forEach((node, i) => {
        if(node.green){
            let position = graphLines[i].indexOf('shape')-1;
            let add = ' style="filled" fillcolor="green" ';
            var output = [graphLines[i].slice(0, position), add, graphLines[i].slice(position)].join('');
            graphLines[i] = output;
        }
    });
    for(var i = 0;i<graphLines.length;i++){
        if(graphLines[i].includes('n0')){
            graphLines.splice(i,1);
        }
    }
    var gr = graphLines.join('\n');
    return gr;
}
function AddGreenPath(edges){
    let counter = 0;
    let next = edges[counter];
    const path = func_params;
    while(checkAddGreenLines1(next)) {let {from, to} = next;
        from.green = true; let fromResult = null;
        try {fromResult = eval(path.join('') + ' ' + from.expression + ';');
            path.push(from.expression + ';');
            counter += 1;} catch (e) {
            fromResult = eval(path.join('') + ' var ' + from.expression + ';');
            path.push('var ' + from.expression + ';');
            counter += 1;}
        if (checkAddGreenLines2(from,fromResult)) {to = edges[counter].to;}
        next = edges.find((edge, i) => {
            counter = i;
            return to.expression === edge.from.expression;});
        if(checkAddGreenLines3(next)) {
            next=edges[counter+1];
            next.to.green = true;}}
    turnGreen(next);}

function checkAddGreenLines1(next){
    return next && next.to;
}
function checkAddGreenLines2(from,fromResult){
    return from.condition && !fromResult;
}
function checkAddGreenLines3(next){
    return next && next.from.green;
}
function turnGreen(next) {
    if (next) {
        next.from.green = true;
    }
}
function getNodeExpression(line){
    const start = line.indexOf(':')+1;
    const end = line.indexOf('" shape',start);
    return line.substring(start,end).trim();
}
function printAllNodes(nodes,counter,output) {
    // print all the nodes:
    for (const [i, node] of nodes.entries()) {
        let { label } = node;
        output.push(`n${counter + i} [label="${label}"`);
        if(node.shape) {
            output.push(` shape="${node.shape}"`);
            output.push(']\n');
        }else{
            output.push(']\n');
        }
    }

}


function dot(cfg, options) {
    const { counter } = options;
    const output = [];
    const nodes = cfg[2];
    printAllNodes(nodes,counter,output);
    // print all the edges:
    printAllEdges(nodes,output,counter);
    options.counter += nodes.length;
    output.pop();
    output.pop();
    return output.join('');
}
function printAllEdges(nodes,output,counter){
    for (const [i, node] of nodes.entries()) {
        for (const type of ['normal', 'true', 'false']) {
            const next = node[type];
            if (!next) continue;
            output.push(`n${counter + i} -> n${counter + nodes.indexOf(next)} [`);
            if (['true', 'false'].includes(type)) output.push(`label="${type}"`);
            output.push(']\n');
        }}
}
export {
    parseCode,
    runParser,
    assignParams,
    func_params,
    argsStr,
    parseArgs,
    printAllNodes,
    loopArgs,
    paramList,
    convertValue,
    addToCodeGraph,
    loop_test,
    parseToGraph,
    fillGreenPath,
    AddGreenPath,

};
