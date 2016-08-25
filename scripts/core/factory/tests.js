QUnit.test( "hello test", function( assert ) {
	assert.ok( 1 == "1", "Passed!" );
});

QUnit.test( "empty add when first argument isn't string", function( assert ) {
	assert.ok( $.factory.add() == null, "null when first arg is empty passed" );
	assert.ok( $.factory.add({}) == null, "null when first arg is object passed" );
	assert.ok( $.factory.add(undefined) == null, "null when arg is undefined passed" );
});

QUnit.test( "create object", function( assert ) {
	assert.ok( $.factory.create("object") != null, "create object passed" );
});

QUnit.test( "add test type and create", function( assert ) {
	$.factory.add("test");
	assert.ok( $.factory.create("test") != null, "create instanse of test passed" );
	assert.ok( $.factory.create("test")._ != null, "_ in object passed" );
});

QUnit.test( "add test type with default simple value and create", function( assert ) {
	$.factory.add("test", { a: 1 });
	assert.ok( $.factory.create("test").a === 1, "default value passed" );
	assert.ok( $.factory.create({a: 2}, "test").a === 2, "default value replace passed" );
});

QUnit.test( "add test type with default complex value and create", function( assert ) {
	$.factory.add("test", { a: {b: 1 } });
	assert.ok( $.factory.create("test").a.b === 1, "default value passed" );
	assert.ok( $.factory.create({a: {b: 2}}, "test").a.b === 2, "default value replace passed" );
});

QUnit.test( "add test type with default complex object and create", function( assert ) {
	$.factory.add("test", { a: 1 });
	$.factory.add("test1", { test: { type: "test" } });
	//assert.ok( $.factory.create("test1").test.a === 1, "default value passed" );
//	assert.ok( $.factory.create({a: {b: 2}}, "test").a.b === 2, "default value replace passed" );
});

