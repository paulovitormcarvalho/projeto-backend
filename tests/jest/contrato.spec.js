const { parseImage, parseOption, parseProduct } = require('../../src/services/productInput');
const { productOutput } = require('../../src/services/productOutput');

describe('Contrato da API Digital Store', () => {
  test('produto mínimo válido com atributos opcionais', () => {
    const p = parseProduct({name:'Teste',slug:'teste',price:100,price_with_discount:75});
    expect(p.description).toBe('');
  });
  test('imagem recebe content e type', () => {
    expect(parseImage({type:'image/png',content:'https://example.com/test.png'},false).path)
      .toBe('https://example.com/test.png');
  });
  test('opções usam defaults', () => {
    const opt = parseOption({title:'Cor',values:['Preto']},false);
    expect(opt.shape).toBe('square');
    expect(opt.type).toBe('text');
  });
  test('GET de produto segue o contrato público', () => {
    const response=productOutput({id:1,name:'Fone',slug:'fone',enabled:true,stock:2,
      description:'',price:'100.00',price_with_discount:'80.00',categories:[{id:1}],
      images:[{id:1,path:'/media/p.png'}],options:[]});
    expect(response.category_ids).toEqual([1]);
    expect(response.images).toEqual([{id:1,content:'/media/p.png'}]);
  });
});
