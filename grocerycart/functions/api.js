// Cloudflare Pages Function — replaces api.php
// Bindings required (set in Pages dashboard → Settings → Functions):
//   KV namespace: GROCERY_KV
//   Secret vars:  PW_TOKEN, ANTHROPIC_KEY

const DEFAULT_DATA = {
  entries: [],
  recipes: [
    {"id":"rcmykeaht","name":"Tidler Soup","emoji":"🍲","ingredients":[{"id":"ipzmzfyhp","name":"bacon","normalName":"bacon","amount":"3","unit":"slices"},{"id":"i7ud8ipa9","name":"onion","normalName":"onion","amount":"1","unit":"medium"},{"id":"izt3k1mvt","name":"whole-kernel corn","normalName":"wholekernel corn","amount":"17","unit":"oz can"},{"id":"ilg971274","name":"condensed cream of chicken soup","normalName":"condensed cream of chicken soup","amount":"1","unit":"can"},{"id":"ihkvmx16q","name":"condensed cream of celery soup","normalName":"condensed cream of celery soup","amount":"1","unit":"can"},{"id":"i16w01gss","name":"milk","normalName":"milk","amount":"2⅔","unit":"cups"},{"id":"i0k0ndwz7","name":"black pepper","normalName":"black pepper","amount":"¼","unit":"tsp"},{"id":"i70p2q7k8","name":"muenster or Monterey Jack cheese","normalName":"muenster or monterey jack cheese","amount":"1½","unit":"cups"},{"id":"iyz67k8u4","name":"green chilies","normalName":"green chilies","amount":"2","unit":"tbsp"},{"id":"ibjsjvc4z","name":"cooked chicken","normalName":"cooked chicken","amount":"1½","unit":"cups"},{"id":"ikcixbppx","name":"avocado","normalName":"avocado","amount":"1","unit":"large"}]},
    {"id":"r2m8tpn5a","name":"Ricotta and Spinach Lasagna","emoji":"🍝","ingredients":[{"id":"i5id0dyb3","name":"spinach","normalName":"spinach","amount":"2","unit":"lb"},{"id":"i8cisr594","name":"eggs","normalName":"eggs","amount":"3","unit":""},{"id":"in547a822","name":"ricotta cheese","normalName":"ricotta cheese","amount":"2","unit":"cups"},{"id":"i17v48wsz","name":"parmesan cheese","normalName":"parmesan cheese","amount":"¼","unit":"cup"},{"id":"i7yw3wiin","name":"green onions","normalName":"green onions","amount":"3","unit":""},{"id":"i8ujk9bq5","name":"pasta sauce","normalName":"pasta sauce","amount":"1½","unit":"cups"},{"id":"iqiur35wi","name":"lasagna noodles","normalName":"lasagna noodles","amount":"12","unit":""},{"id":"ihf12kjtx","name":"cheddar cheese","normalName":"cheddar cheese","amount":"1","unit":"cup"}]},
    {"id":"rofn2oge1","name":"Salmon and Sun-Dried Tomato Pasta","emoji":"🐟","ingredients":[{"id":"i5ldbhob4","name":"farfalle pasta","normalName":"farfalle pasta","amount":"2","unit":"cups"},{"id":"igdqkkycl","name":"salmon fillets","normalName":"salmon fillets","amount":"3","unit":""},{"id":"io91nfv69","name":"olive oil","normalName":"olive oil","amount":"2","unit":"tbsp"},{"id":"ioqj36u0f","name":"onion","normalName":"onion","amount":"1","unit":""},{"id":"i9m47nyrz","name":"sun-dried tomatoes","normalName":"sundried tomatoes","amount":"¾","unit":"cup"},{"id":"ipq9d00ti","name":"heavy cream","normalName":"heavy cream","amount":"1¼","unit":"cups"},{"id":"i3yrlmg01","name":"spinach","normalName":"spinach","amount":"1","unit":"lb"},{"id":"ithewm7tz","name":"parmesan cheese","normalName":"parmesan cheese","amount":"½","unit":"cup"}]},
    {"id":"rc35xzf4x","name":"Gnocchi with Spinach, Tomato & Pine Nuts","emoji":"🫕","ingredients":[{"id":"i93u8pv2n","name":"heavy cream","normalName":"heavy cream","amount":"¾","unit":"cup"},{"id":"isudhp560","name":"crushed tomatoes","normalName":"crushed tomatoes","amount":"1","unit":"can"},{"id":"ikbf61qfi","name":"garlic","normalName":"garlic","amount":"2","unit":"cloves"},{"id":"i1oyz61ax","name":"sun-dried tomatoes","normalName":"sundried tomatoes","amount":"½","unit":"cup"},{"id":"ixosoxtmo","name":"potato gnocchi","normalName":"potato gnocchi","amount":"1","unit":"lb"},{"id":"i19ifxdfr","name":"spinach","normalName":"spinach","amount":"1","unit":"lb"},{"id":"imsptrd0s","name":"pine nuts","normalName":"pine nuts","amount":"½","unit":"cup"}]},
    {"id":"re10ogl3f","name":"Marry Me Chicken","emoji":"🍗","ingredients":[{"id":"ircemov7t","name":"chicken breasts","normalName":"chicken breasts","amount":"3","unit":""},{"id":"i0le9xzad","name":"salt","normalName":"salt","amount":"","unit":"to taste"},{"id":"iijmdxf5n","name":"black pepper","normalName":"black pepper","amount":"","unit":"to taste"},{"id":"i9kmcyyj0","name":"all purpose flour","normalName":"all purpose flour","amount":"¼","unit":"cup"},{"id":"ioudosj9w","name":"olive oil","normalName":"olive oil","amount":"3","unit":"tbsp"},{"id":"imb901err","name":"butter","normalName":"butter","amount":"3","unit":"tbsp"},{"id":"ii201bbyz","name":"garlic","normalName":"garlic","amount":"3","unit":"cloves"},{"id":"iwgjcczxh","name":"tomato paste","normalName":"tomato paste","amount":"1","unit":"tbsp"},{"id":"ibzut72lq","name":"dried oregano","normalName":"dried oregano","amount":"½","unit":"tsp"},{"id":"i142l8266","name":"red pepper flakes","normalName":"red pepper flakes","amount":"","unit":"pinch"},{"id":"i8cp5o4bd","name":"chicken broth","normalName":"chicken broth","amount":"1","unit":"cup"},{"id":"iv011i84v","name":"heavy cream","normalName":"heavy cream","amount":"¾","unit":"cup"},{"id":"iso0bcqw3","name":"parmesan cheese","normalName":"parmesan cheese","amount":"½","unit":"cup"},{"id":"ixtflj9vj","name":"sun-dried tomatoes","normalName":"sundried tomatoes","amount":"⅓","unit":"cup"},{"id":"i8jmbjl67","name":"fresh basil","normalName":"fresh basil","amount":"","unit":"handful"}]},
    {"id":"rzfugutmy","name":"Grilled Chicken and Vegetables with Rice","emoji":"🍖","ingredients":[{"id":"ivf8d2zhf","name":"chicken thighs","normalName":"chicken thighs","amount":"2","unit":"lbs"},{"id":"i9uvbu2za","name":"mushrooms","normalName":"mushrooms","amount":"1","unit":"cup"},{"id":"ihnp2lpp4","name":"zucchini","normalName":"zucchini","amount":"1","unit":""},{"id":"i47fhp5ka","name":"tomatoes","normalName":"tomatoes","amount":"2","unit":""},{"id":"i0gy40xdg","name":"bell peppers","normalName":"bell peppers","amount":"2","unit":""},{"id":"il49ka6ay","name":"white rice","normalName":"white rice","amount":"1","unit":"cup"},{"id":"ixu7kx3hw","name":"teriyaki or yum yum sauce","normalName":"teriyaki or yum yum sauce","amount":"","unit":"to taste"}]},
    {"id":"r93jmtkm6","name":"Lucy Whoop","emoji":"🍅","ingredients":[{"id":"i8efk1dro","name":"roasted red pepper tomato soup","normalName":"roasted red pepper tomato soup","amount":"2","unit":"boxes"},{"id":"irnp4zc47","name":"bread","normalName":"bread","amount":"1","unit":"loaf"},{"id":"i5p61ciyr","name":"cheese slices","normalName":"cheese slices","amount":"8","unit":""},{"id":"ir27z3kra","name":"mixed greens","normalName":"mixed greens","amount":"1","unit":"bag"},{"id":"igq18jadt","name":"salad toppings","normalName":"salad toppings","amount":"","unit":"as desired"}]},
    {"id":"rzi26s0yq","name":"Cheeseburgers with Fries","emoji":"🍔","ingredients":[{"id":"ivil9u6zp","name":"frozen burger patties","normalName":"frozen burger patties","amount":"6","unit":""},{"id":"iixm16ef9","name":"burger seasoning","normalName":"burger seasoning","amount":"","unit":"to taste"},{"id":"izxletn1i","name":"cheese slices","normalName":"cheese slices","amount":"6","unit":""},{"id":"i26c33190","name":"lettuce","normalName":"lettuce","amount":"1","unit":"head"},{"id":"i6p13agzx","name":"tomatoes","normalName":"tomatoes","amount":"2","unit":""},{"id":"ip0uon3x0","name":"burger buns","normalName":"burger buns","amount":"6","unit":""},{"id":"ikdaq1sxv","name":"baked beans","normalName":"baked beans","amount":"1","unit":"can"},{"id":"iogf420qj","name":"frozen fries or tater tots","normalName":"frozen fries or tater tots","amount":"1","unit":"bag"}]},
    {"id":"rbz53c0z4","name":"Instant Pot Chicken Curry","emoji":"🍛","ingredients":[{"id":"io5nmshmz","name":"chicken","normalName":"chicken","amount":"1.2","unit":"lbs"},{"id":"igojrqpaw","name":"coconut milk","normalName":"coconut milk","amount":"1","unit":"can"},{"id":"ipv3eayfu","name":"ginger","normalName":"ginger","amount":"1","unit":"tsp"},{"id":"i0yfruky3","name":"curry powder","normalName":"curry powder","amount":"1","unit":"tbsp"},{"id":"in7h9h5qd","name":"fire-roasted tomatoes","normalName":"fireroasted tomatoes","amount":"1","unit":"can"},{"id":"i92swdg29","name":"garlic oil","normalName":"garlic oil","amount":"1","unit":"tbsp"},{"id":"ifwl5mece","name":"cilantro","normalName":"cilantro","amount":"","unit":"handful"},{"id":"ihsm2qpqp","name":"white rice","normalName":"white rice","amount":"2","unit":"cups"}]},
    {"id":"rycpd5heb","name":"Mexican Street Tacos","emoji":"🌮","ingredients":[{"id":"iq22d3d7p","name":"al pastor meat","normalName":"al pastor meat","amount":"1.5","unit":"lbs"},{"id":"i0ds4ocb1","name":"corn tortillas","normalName":"corn tortillas","amount":"12","unit":""},{"id":"i6bgrjuey","name":"cilantro","normalName":"cilantro","amount":"½","unit":"cup"},{"id":"in2hkh6cy","name":"white cheese","normalName":"white cheese","amount":"1","unit":"cup"},{"id":"il5mwvbo5","name":"black beans","normalName":"black beans","amount":"1","unit":"can"},{"id":"itnf0t97o","name":"salad greens","normalName":"salad greens","amount":"1","unit":"bag"}]},
    {"id":"rvm3o27as","name":"Mediterranean Grain Bowl","emoji":"🥗","ingredients":[{"id":"ierv26r1z","name":"quinoa or farro","normalName":"quinoa or farro","amount":"2","unit":"cups"},{"id":"i109wz0yt","name":"chicken","normalName":"chicken","amount":"1","unit":"lb"},{"id":"ig7cbbyjb","name":"paprika","normalName":"paprika","amount":"1","unit":"tsp"},{"id":"iqxlc690z","name":"garlic powder","normalName":"garlic powder","amount":"1","unit":"tsp"},{"id":"i8704o0ye","name":"cumin","normalName":"cumin","amount":"1","unit":"tsp"},{"id":"idqzx3pr9","name":"zucchini","normalName":"zucchini","amount":"1","unit":""},{"id":"i50ghu2rd","name":"bell peppers","normalName":"bell peppers","amount":"2","unit":""},{"id":"izv10ynqq","name":"tomatoes","normalName":"tomatoes","amount":"2","unit":""},{"id":"idqnmryp4","name":"mixed greens","normalName":"mixed greens","amount":"2","unit":"cups"},{"id":"idckm8hw7","name":"feta cheese","normalName":"feta cheese","amount":"½","unit":"cup"},{"id":"ichrh86th","name":"kalamata olives","normalName":"kalamata olives","amount":"¼","unit":"cup"},{"id":"idh5bi3g8","name":"parsley","normalName":"parsley","amount":"¼","unit":"cup"}]},
    {"id":"rb3s7uhq2","name":"Dad's Ramen","emoji":"🍜","ingredients":[{"id":"if59snlw6","name":"chicken broth","normalName":"chicken broth","amount":"2","unit":"cups"},{"id":"i1otzrq41","name":"carrots","normalName":"carrots","amount":"2","unit":""},{"id":"iiyrih6a1","name":"mushrooms","normalName":"mushrooms","amount":"1","unit":"cup"},{"id":"ix3v2vws0","name":"ramen noodle packs","normalName":"ramen noodle packs","amount":"2","unit":""},{"id":"iypkadh5s","name":"spinach","normalName":"spinach","amount":"1","unit":"cup"},{"id":"iqvmw34iy","name":"cooked meat","normalName":"cooked meat","amount":"1","unit":"cup"},{"id":"i55dxi5ow","name":"eggs","normalName":"eggs","amount":"2","unit":"optional"}]},
    {"id":"r99v4uavx","name":"French Onion Soup","emoji":"🧅","ingredients":[{"id":"ibr91u7db","name":"butter","normalName":"butter","amount":"5","unit":"tbsp"},{"id":"ilgcwn4d8","name":"olive oil","normalName":"olive oil","amount":"2","unit":"tbsp"},{"id":"ijbttsl2n","name":"yellow onion","normalName":"yellow onion","amount":"8","unit":"cups sliced"},{"id":"ibxbliouu","name":"all purpose flour","normalName":"all purpose flour","amount":"2","unit":"tbsp"},{"id":"i4ixtckb1","name":"beef broth","normalName":"beef broth","amount":"6","unit":"cups"},{"id":"ireem7mzk","name":"white wine","normalName":"white wine","amount":"½","unit":"cup"},{"id":"ioa1h1cqe","name":"baguette","normalName":"baguette","amount":"1","unit":""},{"id":"iqtw060w6","name":"gruyere cheese","normalName":"gruyere cheese","amount":"2","unit":"cups"}]},
    {"id":"rca5vtq9b","name":"Redneck Chili","emoji":"🌶️","ingredients":[{"id":"ibk1pr9g0","name":"breakfast sausage","normalName":"breakfast sausage","amount":"1","unit":"tube"},{"id":"iguwgtrjb","name":"onion","normalName":"onion","amount":"1","unit":""},{"id":"i37bc0k8a","name":"garlic","normalName":"garlic","amount":"2","unit":"cloves"},{"id":"i9w4sa7u7","name":"diced tomatoes","normalName":"diced tomatoes","amount":"1","unit":"large can"},{"id":"iazzhr7yr","name":"chili beans","normalName":"chili beans","amount":"1","unit":"can"},{"id":"iplxyhjfp","name":"nacho cheese dip","normalName":"nacho cheese dip","amount":"1","unit":"jar"},{"id":"izqknc7z2","name":"Fritos","normalName":"fritos","amount":"1","unit":"bag"},{"id":"iiejxhcd2","name":"sour cream","normalName":"sour cream","amount":"½","unit":"cup"},{"id":"ilg7mfebw","name":"shredded cheddar","normalName":"shredded cheddar","amount":"1","unit":"cup"}]},
    {"id":"rgt6dud1e","name":"Chorizo with Black Beans","emoji":"🫘","ingredients":[{"id":"ib3vb8x3w","name":"chorizo","normalName":"chorizo","amount":"1","unit":"lb"},{"id":"ig3035wni","name":"garlic","normalName":"garlic","amount":"3","unit":"cloves"},{"id":"ifgk0rm7m","name":"onion","normalName":"onion","amount":"1","unit":""},{"id":"im527oy2a","name":"green pepper","normalName":"green pepper","amount":"1","unit":""},{"id":"iac11i4fs","name":"olive oil","normalName":"olive oil","amount":"2","unit":"tbsp"},{"id":"i4sctrfnw","name":"jalapeño","normalName":"jalapeo","amount":"1","unit":""},{"id":"i3km0jtju","name":"black beans","normalName":"black beans","amount":"2","unit":"cans"},{"id":"iqg856z8g","name":"Rotel tomatoes","normalName":"rotel tomatoes","amount":"1","unit":"can"},{"id":"i42o4tkwb","name":"corn tortillas","normalName":"corn tortillas","amount":"12","unit":""}]},
    {"id":"rk3oceuzz","name":"Chicken Enchiladas","emoji":"🌯","ingredients":[{"id":"i15rbasvm","name":"onion","normalName":"onion","amount":"1","unit":""},{"id":"iqwxnqxop","name":"jalapeños","normalName":"jalapeos","amount":"2","unit":""},{"id":"it5txvwmg","name":"garlic","normalName":"garlic","amount":"3","unit":"cloves"},{"id":"imx9mwpcy","name":"chili powder","normalName":"chili powder","amount":"2","unit":"tbsp"},{"id":"io7kfmi3c","name":"cumin","normalName":"cumin","amount":"1","unit":"tsp"},{"id":"irmys4yqn","name":"tomato sauce","normalName":"tomato sauce","amount":"2","unit":"cans"},{"id":"ic20i2rtt","name":"chicken breasts","normalName":"chicken breasts","amount":"2","unit":"lbs"},{"id":"i15iwsila","name":"cheddar cheese","normalName":"cheddar cheese","amount":"1","unit":"cup"},{"id":"i22g1bpa4","name":"monterey jack cheese","normalName":"monterey jack cheese","amount":"1","unit":"cup"},{"id":"iiml8gzpa","name":"corn tortillas","normalName":"corn tortillas","amount":"12","unit":""},{"id":"iuzyq8bnk","name":"cilantro","normalName":"cilantro","amount":"¼","unit":"cup"}]},
    {"id":"r9ck1i3ox","name":"Penne Boscaiola","emoji":"🍄","ingredients":[{"id":"iispi3uh6","name":"penne pasta","normalName":"penne pasta","amount":"1","unit":"lb"},{"id":"ic02bso8f","name":"olive oil","normalName":"olive oil","amount":"2","unit":"tbsp"},{"id":"inusdj9vk","name":"onion","normalName":"onion","amount":"1","unit":""},{"id":"ikfdwoj5b","name":"garlic","normalName":"garlic","amount":"3","unit":"cloves"},{"id":"iafuh65qf","name":"bacon","normalName":"bacon","amount":"6","unit":"strips"},{"id":"i2eh1wwfd","name":"mushrooms","normalName":"mushrooms","amount":"2","unit":"cups"},{"id":"i0sqsybxb","name":"heavy cream","normalName":"heavy cream","amount":"1","unit":"cup"},{"id":"iahpvd5x2","name":"parmesan cheese","normalName":"parmesan cheese","amount":"½","unit":"cup"}]},
    {"id":"r9jw6j0io","name":"Panko Crusted Salmon","emoji":"🐟","ingredients":[{"id":"iszox7dmv","name":"salmon fillets","normalName":"salmon fillets","amount":"4","unit":""},{"id":"iz8sxcz2w","name":"panko bread crumbs","normalName":"panko bread crumbs","amount":"½","unit":"cup"},{"id":"i67senxqm","name":"parsley","normalName":"parsley","amount":"2","unit":"tbsp"},{"id":"ih3ijcqq0","name":"lemon","normalName":"lemon","amount":"1","unit":"zested"},{"id":"i5aeuabpg","name":"dijon mustard","normalName":"dijon mustard","amount":"2","unit":"tbsp"}]},
    {"id":"rr0jasygr","name":"Baked Shrimp Scampi","emoji":"🦐","ingredients":[{"id":"i791v2av9","name":"shrimp","normalName":"shrimp","amount":"2","unit":"lbs"},{"id":"iummr12mt","name":"olive oil","normalName":"olive oil","amount":"3","unit":"tbsp"},{"id":"itq2k5k08","name":"white wine","normalName":"white wine","amount":"¼","unit":"cup"},{"id":"i49rwwt69","name":"butter","normalName":"butter","amount":"4","unit":"tbsp"},{"id":"iemdhsq8z","name":"garlic","normalName":"garlic","amount":"4","unit":"cloves"},{"id":"isf33ybev","name":"shallots","normalName":"shallots","amount":"2","unit":""},{"id":"iehgaur5q","name":"parsley","normalName":"parsley","amount":"¼","unit":"cup"},{"id":"iwp9ei000","name":"lemon","normalName":"lemon","amount":"1","unit":"zested"},{"id":"iv799h7i0","name":"panko bread crumbs","normalName":"panko bread crumbs","amount":"¼","unit":"cup"}]},
    {"id":"rfbf6x6w0","name":"Hamburger Rice Skillet","emoji":"🥘","ingredients":[{"id":"icajyco3w","name":"ground beef","normalName":"ground beef","amount":"1","unit":"lb"},{"id":"ik5g954zy","name":"onion","normalName":"onion","amount":"1","unit":""},{"id":"i077v0zdh","name":"bell pepper","normalName":"bell pepper","amount":"1","unit":""},{"id":"ih161kuid","name":"Rotel tomatoes","normalName":"rotel tomatoes","amount":"1","unit":"can"},{"id":"iz4weokps","name":"white rice","normalName":"white rice","amount":"1","unit":"cup"},{"id":"in5g9p3zg","name":"taco seasoning","normalName":"taco seasoning","amount":"1","unit":"packet"},{"id":"ihtw0i529","name":"lettuce","normalName":"lettuce","amount":"1","unit":"cup"},{"id":"ie2877atj","name":"tomatoes","normalName":"tomatoes","amount":"2","unit":""},{"id":"ioejdhphf","name":"avocado","normalName":"avocado","amount":"1","unit":""},{"id":"i1qvn0xwx","name":"shredded cheese","normalName":"shredded cheese","amount":"1","unit":"cup"}]},
    {"id":"raoatqu5u","name":"Chicken Spaghetti","emoji":"🍝","ingredients":[{"id":"is7bufnxu","name":"bell pepper","normalName":"bell pepper","amount":"1","unit":""},{"id":"iwjz5iubn","name":"onion","normalName":"onion","amount":"1","unit":""},{"id":"ijf4ffvxd","name":"chicken broth","normalName":"chicken broth","amount":"2","unit":"cups"},{"id":"i8ehmtmx8","name":"condensed cream of chicken soup","normalName":"condensed cream of chicken soup","amount":"1","unit":"can"},{"id":"iwu01oudg","name":"condensed cream of mushroom soup","normalName":"condensed cream of mushroom soup","amount":"1","unit":"can"},{"id":"i4udyjefj","name":"cooked chicken","normalName":"cooked chicken","amount":"3","unit":"cups"},{"id":"i2vfall0z","name":"Rotel tomatoes","normalName":"rotel tomatoes","amount":"1","unit":"can"},{"id":"itycavsks","name":"Velveeta","normalName":"velveeta","amount":"16","unit":"oz"},{"id":"i6qoa3j2e","name":"spaghetti","normalName":"spaghetti","amount":"1","unit":"lb"},{"id":"im7gkta6y","name":"mushrooms","normalName":"mushrooms","amount":"1","unit":"cup"},{"id":"ixrbdoyvb","name":"black olives","normalName":"black olives","amount":"1","unit":"can"}]}
  ],
  shoppingList: [],
  pantry: {
    "butter":{"name":"butter","inStock":true},"all purpose flour":{"name":"all purpose flour","inStock":true},
    "whole milk":{"name":"whole milk","inStock":true},"eggs":{"name":"eggs","inStock":true},
    "salt":{"name":"salt","inStock":true},"black pepper":{"name":"black pepper","inStock":true},
    "olive oil":{"name":"olive oil","inStock":true},"vegetable oil":{"name":"vegetable oil","inStock":true},
    "canola oil":{"name":"canola oil","inStock":true},"white sugar":{"name":"white sugar","inStock":true},
    "brown sugar":{"name":"brown sugar","inStock":true},"powdered sugar":{"name":"powdered sugar","inStock":true},
    "baking powder":{"name":"baking powder","inStock":true},"baking soda":{"name":"baking soda","inStock":true},
    "vanilla extract":{"name":"vanilla extract","inStock":true},"garlic":{"name":"garlic","inStock":true},
    "yellow onion":{"name":"yellow onion","inStock":true},"chicken broth":{"name":"chicken broth","inStock":true},
    "beef broth":{"name":"beef broth","inStock":true},"soy sauce":{"name":"soy sauce","inStock":true},
    "white vinegar":{"name":"white vinegar","inStock":true},"apple cider vinegar":{"name":"apple cider vinegar","inStock":true},
    "hot sauce":{"name":"hot sauce","inStock":true},"mayonnaise":{"name":"mayonnaise","inStock":true},
    "yellow mustard":{"name":"yellow mustard","inStock":true},"ketchup":{"name":"ketchup","inStock":true},
    "worcestershire sauce":{"name":"worcestershire sauce","inStock":true},"pasta":{"name":"pasta","inStock":true},
    "white rice":{"name":"white rice","inStock":true},"rolled oats":{"name":"rolled oats","inStock":true},
    "bread crumbs":{"name":"bread crumbs","inStock":true},"canned diced tomatoes":{"name":"canned diced tomatoes","inStock":true},
    "tomato paste":{"name":"tomato paste","inStock":true},"lemon":{"name":"lemon","inStock":true},
    "lime":{"name":"lime","inStock":true},"honey":{"name":"honey","inStock":true},
    "maple syrup":{"name":"maple syrup","inStock":true},"dried oregano":{"name":"dried oregano","inStock":true},
    "dried basil":{"name":"dried basil","inStock":true},"cumin":{"name":"cumin","inStock":true},
    "paprika":{"name":"paprika","inStock":true},"garlic powder":{"name":"garlic powder","inStock":true},
    "onion powder":{"name":"onion powder","inStock":true},"red pepper flakes":{"name":"red pepper flakes","inStock":true},
    "chili powder":{"name":"chili powder","inStock":true},"cinnamon":{"name":"cinnamon","inStock":true},
    "cornstarch":{"name":"cornstarch","inStock":true},"vegetable broth":{"name":"vegetable broth","inStock":true},
    "water":{"name":"water","inStock":true}
  }
};

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-PriceWatch-Token',
};

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: JSON_HEADERS });
  }

  const token = request.headers.get('X-PriceWatch-Token');
  if (!env.PW_TOKEN || token !== env.PW_TOKEN) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: JSON_HEADERS });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (action === 'claude') {
    if (!env.ANTHROPIC_KEY) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_KEY not configured on server' }), { status: 500, headers: JSON_HEADERS });
    }
    const body = await request.json();
    const content = body.image
      ? [
          { type: 'image', source: { type: 'base64', media_type: body.mediaType, data: body.image } },
          { type: 'text', text: body.prompt },
        ]
      : [{ type: 'text', text: body.prompt }];

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{ role: 'user', content }],
      }),
    });
    const data = await anthropicRes.json();
    return new Response(JSON.stringify(data), { headers: JSON_HEADERS });
  }

  if (request.method === 'GET') {
    const stored = await env.GROCERY_KV.get('data', 'json');
    return new Response(JSON.stringify(stored ?? DEFAULT_DATA), { headers: JSON_HEADERS });
  }

  if (request.method === 'POST') {
    const data = await request.json();
    await env.GROCERY_KV.put('data', JSON.stringify(data));
    return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
  }

  return new Response('Method Not Allowed', { status: 405 });
}
