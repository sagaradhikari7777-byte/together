export const defaultMerchants = ['Amazon','Big W','boo Home Bedding','Chinese chicken','coles Supermarkets Australia Pty Ltd','Convenience Spices','Costco','Dominos peri peri','Food','Good day mart','GOODAY MART HURSTVILLE','Hamro nepali pasal','Hurstville Chicken Barn','HURSTVILLE VEGGIE SHED','Iconic','Kmart','Lekhaki Meat','Movie','Priceline','Tk max','Uniqlo','Woolworths','ALDI','Coffee','Fuel'];
export const defaultCategories = ['Groceries','Food & Drink','Transport','Internet','Rent','Entertainment','Shopping','Bills','Other'];
export function catalogValues(h, kind) {
  const defaults = kind === 'merchants' ? defaultMerchants : defaultCategories;
  return [...(h.catalogs?.[kind] ?? defaults)];
}
export function changeCatalog(h, b) {
  const fail = message => { throw Object.assign(new Error(message), {status:400}); };
  if (!['merchants','categories'].includes(b.kind) || !['add','rename','remove'].includes(b.operation)) fail('Choose a valid list action.');
  const list = catalogValues(h,b.kind), max=b.kind==='merchants'?80:40;
  const name = typeof b.name === 'string' ? b.name.trim() : '';
  if (b.operation !== 'remove' && (!name || name.length>max)) fail(`Enter a name up to ${max} characters.`);
  if (b.operation !== 'add' && !list.includes(b.previous)) fail('This item has changed. Refresh the list.');
  if (b.operation !== 'remove' && list.some(n=>n.toLowerCase()===name.toLowerCase() && n!==b.previous)) fail('That name is already in the list.');
  if (b.operation==='add' && list.length>=200) fail('This list can contain up to 200 items.');
  h.catalogs ??= {};
  h.catalogs[b.kind] = b.operation==='add' ? [...list,name] : b.operation==='remove' ? list.filter(n=>n!==b.previous) : list.map(n=>n===b.previous?name:n);
}
