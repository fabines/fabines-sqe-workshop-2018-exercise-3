import assert from 'assert';
import * as parser from '../src/js/code-analyzer';

describe('assignParams', () => {
    const parse = parser.runParser('function foo(x,y,z){' +
        'let a = 2;' +
        '}','1,[2,1,3.14],[\'meow\',"chika"]');
    const funcParams=parser.func_params;
    it('assignsParams', () => {
        const code = 'function foo(x,y,z){}';
        let parsedCode = parser.parseCode(code);
        const assign=parser.assignParams(parsedCode.body[0],'');
        console.log("---------------------------------------------------------"+assign);
        assert.equal(assign, undefined);
    });
    it('convert Value', () => {
        const convert= parser.convertValue('');
        console.log("---------------------------------------------------------"+convert);
        assert.equal(convert, '');
    });
    it('paramList', () => {
        const paramsList= parser.paramList('');
        console.log("---------------------------------------------------------"+paramsList);
        assert.equal(paramsList, undefined);
    });
    it('assigns x', () => {
        console.log("---------------------------------------------------------"+funcParams[0]);
        assert.equal(funcParams[0], 'var x=1;');
    });
    it('assigns y', () => {
        console.log("---------------------------------------------------------"+funcParams[1]);
        assert.equal(funcParams[1], 'var y=[2,1,3.14];');
    });
    it('assigns z', () => {
        console.log("---------------------------------------------------------"+funcParams[2]);
        assert.equal(funcParams[2], 'var z=[\'meow\',\'chika\'];');
    });
    it('parse args- doesnt have any parameters', () => {
        const parseArg= parser.parseArgs('');
        console.log("---------------------------------------------------------"+parseArg);
        assert.equal(parseArg, undefined);
    });
    it('loop test', () => {
        const bool1 = parser.loop_test(0,0,'');
        console.log("---------------------------------------------------------"+bool1);
        assert.equal(bool1, false);
    });

});

describe('parseToGraph', () => {
    const graph = parser.runParser('function foo(x, y, z){\n' +
        '    let a = x + 1;\n' +
        '    let b = a + y;\n' +
        '    let c = 0;\n' +
        '    \n' +
        '    if (b < z) {\n' +
        '        c = c + 5;\n' +
        '    } else if (b < z * 2) {\n' +
        '        c = c + x + 5;\n' +
        '    } else {\n' +
        '        c = c + z + 5;\n' +
        '    }\n' +
        '    \n' +
        '    return c;\n' +
        '}\n','1,2,3');

    it('parse to graph', () => {
        const nodes = [{astNode:{type:'BlockStatement'}, parent:{type:'WhileStatement'}}];
        const result = parser.parseToGraph(nodes);
        console.log("---------------------------------------------------------"+result);
        assert.equal(result[0].shape, 'diamond');
    });
    it('check if diamond shape if', () => {
        console.log("---------------------------------------------------------"+graph.includes('n4 [label="4 : b < z" style="filled" fillcolor="green"  shape="diamond"]'));
        const n4='n4 [label="4 : b < z" style="filled" fillcolor="green"  shape="diamond"]';
        assert.equal(graph.includes(n4), true);
    });
    it('check if not entering to else if (not green path)', () => {
        const n5='n5 [label="5 : c = c + 5" shape="box"]';
        console.log("---------------------------------------------------------"+graph.includes(n5));
        assert.equal(graph.includes(n5), true);
    });
    it('check if return is shape box', () => {
        const n6='n6 [label="6 : return c" style="filled" fillcolor="green"  shape="box"]';
        console.log("---------------------------------------------------------"+graph.includes(n6));
        assert.equal(graph.includes(n6), true);
    });
});
describe('parseToGraph while loop', () => {
    const graph = parser.runParser('function foo(x, y, z){\n' +
        '   let a = x + 1;\n' +
        '   let b = a + y;\n' +
        '   let c = 0;\n' +
        '   \n' +
        '   while (a < z) {\n' +
        '       c = a + b;\n' +
        '       z = c * 2;\n' +
        '       a++;\n' +
        '   }\n' +
        '   \n' +
        '   return z;\n' +
        '}\n','1,2,3');
    it('check if diamond shape while', () => {
        const n4='n4 [label="4 : a < z" style="filled" fillcolor="green"  shape="diamond"]';
        console.log("---------------------------------------------------------"+graph.includes(n4));
        assert.equal(graph.includes(n4), true);
    });
    it('add to graph', () => {
        const addtograph = parser.addToCodeGraph(undefined);
        console.log("---------------------------------------------------------"+addtograph);
        assert.equal(addtograph, '');
    });
    it('check if existing after while into return', () => {
        const nodeReturn='n4 -> n8 [label="false"]';
        console.log("---------------------------------------------------------"+graph.includes(nodeReturn));
        assert.equal(graph.includes(nodeReturn), true);
    });
    // it('add green path', () => {
    //     const nodes = [{astNode:{type:'BlockStatement'}, parent:{type:'WhileStatement'},next:{}}];
    //     const edges = [{from:{nodes},to:{nodes}}]
    //     const addgreenpath=parser.AddGreenPath(edges);
    //     console.log("---------------------------------------------------------"+addgreenpath);
    //     assert.equal(addgreenpath, undefined);
    // });
    // it('check if next (check green lines 1,2,3)', () => {
    //     //const next = {to: {type: 'meow'}, from: {green: true, condition: true}};
    //     const next = {from:{},to:{}};
    //     const fromResult = [];
    //     const check1 = parser.checkAddGreenLines1(next);
    //     const check2 = parser.checkAddGreenLines2(next.from, fromResult);
    //     const check3 = parser.checkAddGreenLines3(next);
    //     console.log("---------------------------------------------------------"+!(check1[0] || check1[1]));
    //     assert.equal(!(check1[0] || check1[1]), true);
    //     assert.equal(check2, true);
    //     assert.equal(check3, true);
    // });

});

describe('test library', () => {
    const graph = parser.runParser('function foo(x, y, z){\n' +
        '   let a = x + 1;\n' +
        '   let b = a + y;\n' +
        '   let c = 0;\n' +
        '   \n' +
        '   while (a < z) {\n' +
        '       c = a + b;\n' +
        '       z = c * 2;\n' +
        '       a++;\n' +
        '   }\n' +
        '   \n' +
        '   return z;\n' +
        '}\n','1,2,3');
    it('check if diamond shape while', () => {
        const n4='n4 [label="4 : a < z" style="filled" fillcolor="green"  shape="diamond"]';
        console.log("---------------------------------------------------------"+graph.includes(n4));
        assert.equal(graph.includes(n4), true);
    });
    it('check if existing after while into return', () => {
        const nodeReturn='n4 -> n8 [label="false"]';
        console.log("---------------------------------------------------------"+graph.includes(nodeReturn));
        assert.equal(graph.includes(nodeReturn), true);
    });
    it('meow',()=>{
        const output=[];
        const node = {label: 'testNode', shape: ''};
        const result= parser.printAllNodes([node],1,output);
        console.log("---------------------------------------------------------"+output);
        assert.equal(output.length,2); // 1 edge 1 vertex
    });
});

