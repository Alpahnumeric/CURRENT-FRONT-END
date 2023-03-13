document.getElementById('sectorDecimal').value = 0.5;
var width = 900,
height = 600,
radius = 60,
shift = false,
isZoomingKey = false,
nodes = [],
links = [],
selectedNode,
selectedTargetNode,
selectedLink, newLine, 
resettingPie = false,
drawingLine = false,
defaultName = "node",
deletingAffectsGraph = true, 
//Required to associate the "delete" button with both the graph and pie, without affecting both when pressing it. 
//When false, the pie is instead eligible for deletions. It's value is based on what the user last clicked on.
div,
pieNode,
linesg,
piesg;

nodes = [{
  "name": "Tea",
  "values": ["Yes", "No"],
  "variablePie": [
  {
      "label": "Yes",
      "id": 1,
      "value": "2/3"
  }, {
      "label": "No",
      "id": 2,
      "value": "1/3"
  }],
  "observedValuePie": null,
  "conditionalTable" : null
  }, {
  "name": "Scone",
  "values": ["Yes", "No"],
  "variablePie": null,
  "observedValuePie": null,
  "conditionalTable" : [
      [0.5, 0.5],
      [0.25, 0.75]
  ]
  }];

links = [{
  "source": 0,
  "target": 1
}];

//var F = d3.scale.ordinal().range(["#66c2a5","#fc8d62","#8da0cb","#e78ac3","#a6d854","#ffd92f","#e5c494","#b3b3b3"]);

//Originally, a "default pie" of one "Outcome" value of 1 was used. 
//With users then being able to go into a pie to add the values they wanted. 
  //Users may add values in different orders, which would badly affect consistency.
//Thus the values array is required to streamline entry for large conditional tables.
   //Otherwise the user would have to edit a lot of pie sector names, and there may be
   //variation between entrance order. 

var graphForce = d3.layout.force() //Explore best params
  .charge(-90)  
  .linkStrength(1)
  .friction(0) //Freeze particles
  .gravity(0.09)
  .distance(100)
  .linkDistance(4 * radius)
  .size([width, height]);

var isZooming = true;

var svg = d3.select("#chart1")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("class", "svg-style")
  .call(d3.behavior.zoom().on("zoom", function () {
    console.log("zoom");
    if(isZooming && isZoomingKey){
      svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
    }
  }))
  .append("g");

d3.select(window)
  .on("keydown", keydown)
  .on("keyup", keyup)
  .on("mousemove", mousemove)
  .on("mouseup", mouseup);

svg.append("rect")
  .attr("width", width)
  .attr("height", height)
  .on("mousedown", mousedown);

var pieNameLabel = null;

// Can't define a single SVG marker and change its colour dynamically.
// Instead, need to define the marker in a function.
function generateArrow(d){
  var fill = "#999" //Grey
  if(d === selectedLink){
    fill = "#ff0000"; //Red
  }
  var arrowID = 'arrowhead' + fill;
  svg.append('defs').append('marker')   ////Explore params more!
    .attrs({'id': arrowID,
    'viewBox':'-0 -5 10 10',
    'refX': 29.4,
    'refY': 0,
    'orient':'auto',
    'markerWidth': 5,
    'markerHeight': 5,
    'xoverflow':'visible'})
    .attr("class", "tooltip")
    .append('svg:path')
    .attr('d', 'M0, -5L10,0L0, 5')
    .attr('fill', fill)
    .style('stroke','none');
  return "url(#" + arrowID + ")";
}

var pie = d3.layout.pie()
  .value(function(d) {return math.number(d.value)})
  .sort(null);
  //Sorted by value.

var arc = d3.svg.arc()
  .outerRadius(radius)
  .innerRadius(0);

linesg = svg.append("g");
piesg = svg.append("g");

function fractionValuesJSON(){
  function fractionConvert(){
    if(typeof sectorValue === 'string' || sectorValue instanceof String){
      return math.fraction(sectorValue);
    }else{
      return sectorValue; 
    }
  }

  for (var nodeIndex = 0; nodeIndex < nodes.length; ++nodeIndex) {
    var node = nodes[nodeIndex];
    var variablePie = node.variablePie;
    if(variablePie !== null){
      for (var s = 0; s < variablePie.length; ++s) { 
        var sector = variablePie[s];
        var sectorValue = sector.value;
        if(typeof sectorValue === 'string' || sectorValue instanceof String){
          sector.value = fractionConvert(sectorValue);
        }
      }
    }
    else{
      var conditionalTable = node.conditionalTable;
      if(conditionalTable[0][0].constructor === Array){
        if(conditionalTable[0][0][0].constructor === Array){
          //4D array (for 3 conditionals)
          conditionalTable.map(function(conditional1) {
            return conditional1.map(function (conditional2){
              return conditional2.map(function (conditional3){
                return conditional3.map(function (v){fractionConvert(v)});
              });
            });
          })
        }else{
          //3D array (for 2 conditionals)
          conditionalTable.map(function(conditional1) {
            return conditional1.map(function (conditional2){
              return conditional2.map(function (v){fractionConvert(v)});
            });
          })
        } 
      }
      else{
         //2D array, for 1 conditional
         conditionalTable.map(function(conditional1) {
          return conditional1.map(function (v){fractionConvert(v)}
          );
        })
      }
    }
  }
}

function displayInstructions(){
  document.getElementById("pieContainer").style.display = "none";
  document.getElementById("instructionsContainer").style.display = "block";
}

var exampleGraphSelection = document.getElementById("exampleGraph");
exampleGraphSelection.addEventListener("click", exampleGraphSelected);
function exampleGraphSelected(event){
   var element = event.target;
   var example = null;
   while (element && !example) {
       if (element.matches("button")) {
           example = element;
       } else {
           // Not found
           if (element === this) {
               element = null;
           } else {
               element = element.parentNode;
           }
       }
   }
   nodes = [];
   links = [];
   d3.json("./" + example.id + ".json", function(json) {
    nodes = json.nodes;
    links = json.links; 
    fractionValuesJSON();
    graphForce = graphForce
      .nodes(nodes)
      .links(links);
    graphForce.start();
    updateGraph(); 
  });
}

fractionValuesJSON();
graphForce = graphForce //Same with this bit. 
    .nodes(nodes)
    .links(links);
graphForce.start();
updateGraph();

function nodeMouseOver(d){
  if (drawingLine && d !== selectedNode) {
    selectedTargetNode = d;
  }
  if(pieNameLabel === null && !shift){
    pieNameLabel = d3.select("#chart1")
    .append("div")
    .attr('pointer-events', 'none')
    .attr("class", "tooltip")
    .style("opacity", 1)
    .html(d.name)
    .style("left", d.x + "px")  //Makes follow the label follow the pie, but doesn't work too well atm. 
    .style("top", d.y + "px");
  }
}

function nodeMouseOut(d){
  if (drawingLine) {
    selectedTargetNode = null;
  }
  if(pieNameLabel !== null){
    pieNameLabel.remove();
    pieNameLabel = null;
  }
}

function nodeMouseDown(d){
  isZooming = false;
  deletingAffectsGraph = true;
  if(pieNameLabel !== null){
    pieNameLabel.remove();
    pieNameLabel = null;
  }
  if (!drawingLine) {
    selectedNode = d;
    displayVariableOnPie(d);
    selectedLink = null;
  }
  if (!shift) {
    drawingLine = true;
  } 
  d.fixed = true;
  graphForce.stop();
  updateGraph();
  setTimeout(function () {isZooming = true;}, 3000);
}

function lineMouseDown(d){
  isZooming = false;
  selectedLink = d;
  selectedNode = null;
  deletingAffectsGraph = true;
  updateGraph();
  setTimeout(function () {isZooming = true;}, 3000);
}

function updateGraph(){
  function dragstart(d) {
    if(shift){
      console.log("dragging");
      if(pieNameLabel !== null){
        pieNameLabel.remove();
        pieNameLabel = null;
      }
      graphForce.stop();
    }
  }

  function dragmove(d) {
    if(shift){
      d.px += d3.event.dx;
      d.py += d3.event.dy;
      d.x += d3.event.dx;
      d.y += d3.event.dy; 
      ticked(); //Key to make it work together with updating both px,py and x,y on d.
    }
  }

  function dragend(d) {
    if(shift){
      d.fixed = true;
      ticked();
      graphForce.resume();
    }
  }

  var link = linesg.selectAll("line.link")
    .data(links)
    .attr("x1", function(d) { return d.source.x; })
    .attr("y1", function(d) { return d.source.y; })
    .attr("x2", function(d) { return d.target.x; })
    .attr("y2", function(d) { return d.target.y; })
    .classed("selected", function(d) { return d === selectedLink; });
    
  link
    .exit()
    .remove();
  
  link
    .enter()
    .append("line")
    .attr("class", "link");
    
  link.each(function(d){
    d3.select(this)
      .attr("marker-end", generateArrow(d));
  });

  link
    .on("mousedown", lineMouseDown);

  var node = piesg.selectAll(".node")
    .data(nodes, function(d){return d.name})
    .classed("selected", function(d) {return d === selectedNode; })
    .classed("selectedTarget", function(d) {return d === selectedTargetNode; })

  node
    .exit()
    .remove();

  nodeg = node.enter()
    .append("g")
    .attr("class", "node")
    .attr("transform", function(d) {return "translate(" + d.x + "," + d.y + ")"; });

  var node_drag = d3.behavior.drag()
    .on("dragstart", dragstart)
    .on("drag", dragmove)
    .on("dragend", dragend);

  nodeg
    .on("mouseover", nodeMouseOver)
    .on("mouseout", nodeMouseOut)
    .on("mousedown", nodeMouseDown)
    .call(node_drag);

  function create_pie(){
    var pieName = "";
    pathsOfPies[index] = d3.select(this).selectAll("path")
      .data(function(d) {
        pieName = d.name; 
        if(d.observedValuePie !== null){
          return pie([d.observedValuePie]);
        }
        else{
          if(d.conditionalTable !== null){
          return pie([{"label": "Conditional", "id": 10, "value": 1}]);
          } 
          else {
            return pie(d.variablePie);
          }  
        }
      });
    textOfPies[index] = d3.select(this).selectAll("text")
      .data(function(d) {
        if(d.observedValuePie !== null){
          return pie([d.observedValuePie]);
        }
        else if(d.conditionalTable !== null){
          return pie([{"label": "Conditional", "id": 10, "value": 1}]);
        }
        else{
          return pie(d.variablePie);
        }
      });

    pathsOfPies[index]
      .enter()
      .append("path")
      .attr("d", arc)
      .style("fill", function(d) {return defaultColorScale(d.data.id);})
      .attr("stroke", "black")
      .transition()
      .style("stroke-width", "1px")
      
    textOfPies[index]
      .enter()
      .append("text")
      .attr("d", arc)
      //.attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"})
    
      //If the segment's midpoint is on the RHS of the pie, set the text anchor to be the start.
      //If it's on the LHS, set it to the end.
      //arc.centroid is calculated using (startAngle + endAngle)/2 and (innerRadius + outerRadius)/2.
      .attr("text-anchor", function(d) {
        d.midPoint = (d.endAngle + d.startAngle)/2;
        return d.midPoint > Math.PI ? "end" : "start";
      })
    
      .attr("transform", function(d) {
          var c = arc.centroid(d),
            x = c[0], y = c[1],
            textOffset = 5,
            h = Math.sqrt(x * x + y * y); 
           return "translate(" + (x/h * (radius + textOffset)) +  ',' + (y/h * (radius + textOffset)) +  ")"; 
        // The offset brings the text label slightly away from the pie's surface. 
      })
      //x, y are absolute coordinates
      //dx, dy are relative coordinates (relative to x, y)

      //em, also known as font size units, are a scalable unit from typography that allows the positioning of text to be dependent on its height. 
      //That is, the actual, physical height of any given portion of font depends on factors such as the user-defined DPI setting, so em values are 
      //translated by the user's browser into the required pixel values.
      //For instance, if the base font size is 10px a value of 1em is translated into 10px, 2em into 20px etc.
      //0.35em specifically has the effect of vertically centering text relative to the absolute y coordinate.

      //However, if the sector is at the far top or far bottom of the pie chart, a pm buffer is included to prevent the text from
      //merging into the pie chart. 5 determined via trial and error - is there a better way?
      .attr('dy', d => {
        var dy = 0.35; 
        if (d.midPt < 0.25 * Math.PI || d.midPt > 1.75 * Math.PI) {
          dy += 5.0;
        }
        if (d.midPt < 1.25 * Math.PI || d.midPt > 0.75 * Math.PI) {
          dy -= 5.0;
        }
        return dy + 'em'; 
      })
      //.attr('dy', 0.35)
      .text(function(d, i){ return d.data.label})
      .attr("class", "text")
      .attr("style", "font-family: arial; font-size: 20; fill: black; stroke: none");

    if(resettingPie){
      pathsOfPies[index]
        .data(pie([]))
        .exit()
        .remove();

      textOfPies[index]
        .data(pie([]))
        .exit()
        .remove();   
    }
    index = index + 1;
  }
  textOfPies = [];
  pathsOfPies = [];
  var index = 0;
  node.each(create_pie);
  resettingPie = false;

  function ticked() {
    link
      .attr("x1", function(d) {return d.source.x;})
      .attr("y1", function(d) {return d.source.y;})
      .attr("x2", function(d) {return d.target.x;})
      .attr("y2", function(d) {return d.target.y;});
    node
      .attr('transform', function(d) {return 'translate(' + d.x + ',' + d.y + ')';});
  };

  graphForce = graphForce
    .nodes(nodes)
    .links(links);
  graphForce.on("tick", ticked);

}

function displayVariableOnPie(d){
  pieNode = d;
  if(d.conditionalTable === null){
    displayUnconditionalPie(d);
  }
  else{
    var conditionedOnLabels = [];
    var conditionedOnPies = [];
    links.forEach(function(l) {
      if (l.target === d) {
        var conditionedOnVariable = l.source
        var pieDataset = conditionedOnVariable.variablePie;
        conditionedOnPies.push(conditionedOnVariable.name);
        var sectorLabelInfo = new Array();
        if(conditionedOnVariable.conditionalTable){
          var sectorLabels = conditionedOnVariable.values;   
          for(l = 0; l < sectorLabels.length; l++){  
            sectorLabelInfo.push({"label" : sectorLabels[l], "id": l+1});
          }
        }else{
          for(l = 0; l < pieDataset.length; l++){  
            var sector = pieDataset[l];
            sectorLabelInfo.push({"label" : sector.label, "id": sector.id});
          }
        }
        conditionedOnLabels.push(sectorLabelInfo)
      }
    });
    displayConditionalPie(d, conditionedOnPies, conditionedOnLabels);
  }
}

function keyup() {
  switch (d3.event.keyCode) {
    case 90: { //z
      isZoomingKey = false;
      break;
    }
    case 16: { // shift
      shift = false;
      updateGraph();
      graphForce.start();
    }
  }
}

// add a new disconnected node
function generateNode(mouse, isConditional){
  function nameUnique(varName){
    for (var index = 0; index < nodes.length; ++index) {
      var n = nodes[index];
      if(n.name == varName){
        return false;
      }
    }
    return true;
  }

  function hasDuplicates(array) {
    return (new Set(array)).size !== array.length;
  }

  function addNodeConditional(varName, valuesInputArray){
    var variablePie = [];
    var nodeConditionalTable = new Array();
    variablePie = [{"label": "Conditional", "id": 10, "value": 1}];
    for (var index = 0; index < nodes.length; ++index) {
      var n = nodes[index];
      if(n.name == selectedNode.name){
        var conditonalValues = n.values;
        var conditonalsNumber = conditonalValues.length;
        break;
      }
    }
    for(var i = 0; i < conditonalsNumber; i++){
      nodeConditionalTable.push([]);
    }
    var generatedNode = {x: mouse[0], y: mouse[1], values: valuesInputArray, variablePie: variablePie, observedValuePie: null, conditionalTable: nodeConditionalTable, name: varName};
    nodes.push(generatedNode);
    selectedLink = null;
    return generatedNode;
  }

  function addNodeUnconditional(varName, valuesInputArray, probInputArray){
    var variablePie = [];
    var numberOfValuesInput = valuesInputArray.length;
    for(var s = 0; s < parseInt(numberOfValuesInput); s++){
      variablePie.push({"label": valuesInputArray[s], "id": (s + 1), "value": parseFloat(probInputArray[s])});
    }
    var generatedNode = {x: mouse[0], y: mouse[1], values: valuesInputArray, variablePie: variablePie, observedValuePie: null, conditionalTable: null, name: varName};
    nodes.push(generatedNode);
    selectedLink = null;
    return generatedNode;
  }

  function getVarName(){
    while (cancel !== true){
      var varName = prompt(promptText);  
      if(varName !== null){
        if(varName.trim().length !== 0){ //I.e. if the varName doesn't just contains spaces. 
          if(nameUnique(varName)){
            //Success
            return varName;
          } 
          else{
            promptText ="You've entered a name that already exists!\nPlease enter another variable name:"
          }
        } 
      }
      else{
        cancel = true;
      }
    }
    return null;
  }

  function getvaluesInputArray(varName){
    var promptText = "Enter the values " +  varName + " can take, each seperated by a comma. \nFor example, 'red,blue,green'. \nEach variable can take between 1 and 10 values."
    while (cancel !== true){
      var valuesInput = prompt(promptText);
      if(valuesInput !== null){
        if(valuesInput.trim().length !== 0){
          var valuesInputArray = valuesInput.split(',');
          var duplicates = hasDuplicates(valuesInputArray);
          if(!duplicates){
            var numberOfValuesInput = valuesInputArray.length;
            var numberOfValuesInput = numberOfValuesInput.toString();
            if(numberOfValuesInput > 0 && numberOfValuesInput < 11  && Math.floor(numberOfValuesInput) === +numberOfValuesInput){ //i.e. Natural number 1, 2 or 3
              //Success
              return valuesInputArray;
            }
            else{
              promptText ="The number of values " +  varName + " can take must be a natural number between 1 and 3: "
            }
          }
          else{
            var promptText = "Your value list contained duplicated entries! \nEnter a new value list:"
          }
        }
      } else{
        cancel = true;
      }
    }
    return null;
  }

  function getProbabilitiesInputArray(valuesInputArray, varName){
    console.log("in function");
    var promptText = "Enter the probabilties that your values '" +  valuesInputArray.toString() + "' can take, each seperated by a comma. For example, '0.2,0.3,0.5'. \n        OR        \n Press 'OK' for uniform probabilities."
    while (cancel !== true){
      console.log("prompt now");
      var probInput = prompt(promptText);
      if(probInput !== null){
        if(probInput.trim().length !== 0){
          var probInputArray = probInput.split(',');
          if(!probInputArray.some(isNaN)){
            var sum = probInputArray.reduce((partialSum, p) => partialSum + parseFloat(p), 0);
            console.log("sum:" + sum);
            if(sum == 1.0){
              return probInputArray;
            }
            else{
              promptText = "Your probabilties must sum to 1. \nAs" + varName + " must take one of the values of " +  valuesInputArray.toString();
            }
          }
          else{
            promptText = "Your probabilties must be decimals: ";
          }
        }
        else{ //Uniform probabilities
          var numberOfValues = valuesInputArray.length;
          var fraction = math.fraction(1, numberOfValues);
          probInputArray = Array(5).fill(fraction);
          return probInputArray;
        }
      } else{
        cancel = true;
      }
    }
    return null;
  }

  var cancel = false;
  var promptText = "You're adding a variable pie.\nVariable's Name:"
  var varName = getVarName();
  var valuesInputArray = getvaluesInputArray(varName);
  if(isConditional){
    if(varName !== null && valuesInputArray !== null){
      var nodeGenerated = addNodeConditional(varName, valuesInputArray);
      return nodeGenerated;
    } else{
      return null;
    }
  }
  else{
    console.log("not conditional");
    var probInputArray = getProbabilitiesInputArray(valuesInputArray, varName);
    console.log("prob input array outside of function:" + probInputArray);
    if(varName !== null && valuesInputArray !== null && probInputArray !== null){
      var nodeGenerated = addNodeUnconditional(varName, valuesInputArray, probInputArray);
      return nodeGenerated;
    } else{
      return null;
    }
  }
}

function addConditionality(sourceNode, targetNode){
  var conditionedOnValues = sourceNode.values;
  var nodeConditionalTable = targetNode.conditionalTable;
  var newNodeConditionalTable = new Array();
  if(!nodeConditionalTable){ // 0 conditionals -> 1 conditional
      for(var v = 0; v < conditionedOnValues.length; v++){
        newNodeConditionalTable.push([]);
        targetNode.variablePie = null;
      }
  }
  else{// 1 conditonal -> 2 conditionals
    for(var i = 0; i < nodeConditionalTable.length; i++){
      var conditionalTableRow = new Array();
      for(var j = 0; j < conditionedOnValues.length; j++){
        conditionalTableRow.push(nodeConditionalTable[i].slice());
      }
      newNodeConditionalTable.push(conditionalTableRow);
    }
  }
  targetNode.conditionalTable = newNodeConditionalTable.slice();
  resettingPie = true;
  graphForce.stop();
  updateGraph();
  graphForce.start();
  resettingPie = true;
}

function mousedown() { 
    var mouse = d3.mouse(svg.node());
    generateNode(mouse, false);
    graphForce.stop();
    updateGraph();
    graphForce.start();
}

function mousemove(){
  if (drawingLine && !shift) {
    var mouse = d3.mouse(svg.node());
    var x = Math.max(0, Math.min(width, mouse[0]));
    var y = Math.max(0, Math.min(height, mouse[1]));
    //Debounce - only start drawing line if it gets of a sufficient size.
    var dx = selectedNode.x - x;
    var dy = selectedNode.y - y;
    if (Math.sqrt(dx * dx + dy * dy) > 10) {
      //Draw a line
      if (!newLine) {
        newLine = linesg.append("line").attr("class", "newLine");
      }
      newLine.attr("x1", function(d) { return selectedNode.x; })
        .attr("y1", function(d) { return selectedNode.y; })
        .attr("x2", function(d) { return x; })
        .attr("y2", function(d) { return y; });
    }
  }
  updateGraph();
}

function mouseup(){ //Add link
  drawingLine = false;
  if (newLine) {
    if (selectedTargetNode) { //Connect link to existing node.
      conditionsOnTargetNode = 0;
      for(var l = 0; l < links.length; l++){
        linkbeingChecked = links[l];
        if (linkbeingChecked.target == selectedTargetNode) { 
          ++conditionsOnTargetNode;
        }
      }
      if(conditionsOnTargetNode < 3){ 
        //The maximum links into the node is 2, as another is about to be added.
        selectedTargetNode.fixed = false;
        links.push({source: selectedNode, target: selectedTargetNode});
        var cycle = isCyclic();
        if(cycle){
          links.pop();
          d3.select("#graphErrorAlert").text("This would add a cycle to the graph!");
          setTimeout(function () {d3.select("#graphErrorAlert").text("");}, 3000);
        }  
        else{
          addConditionality(selectedNode, selectedTargetNode);
          //resettingPie = true;
        }  
        if(pieNode === selectedTargetNode){
          finishLinkAdd();
          displayUnconditionalPie(selectedTargetNode);
          return;
        }
      }  
      else{
        d3.select("#graphErrorAlert").text("A variable can be conditional on at most 3 variables. \n Adding a link to " + selectedTargetNode.name + " would violate this.");
          setTimeout(function () {d3.select("#graphErrorAlert").text("");}, 3000);
      }
    } else { //Connect link to new node.
      var mouse = d3.mouse(svg.node());
      var newNode = generateNode(mouse, true);
      if(newNode !== null){
        links.push({source: selectedNode, target: newNode});
      }
    }
    finishLinkAdd();
  }

  function finishLinkAdd(){
    selectedNode.fixed = false;
    selectedNode =  null;
    selectedTargetNode = null;
    updateGraph();
    newLine.remove();
    newLine = null;
    graphForce.start();
  }
}

function pieUpdated(){  
  //Could you just do on pieNode directly?
  for (var index = 0; index < nodes.length; ++index) {
    var n = nodes[index];
    if(n.name == pieNode.name){
      n.values = variableValues;
      n.variablePie = pieDataset;
      n.observedValuePie = observedValue;  
      n.conditionalTable = conditionalTable; 
      nodes[index] = n;
      break;
    }
  }
  for(var l = 0; l < links.length; l++){
    linkbeingChecked = links[l];
    if (linkbeingChecked.source == pieNode) { 
      var affectedNode = linkbeingChecked.target;
      updateConditionalTable(affectedNode);
    }
  }
  graphForce.stop();
  for(var i = 0; i < 10; i++){
    //As each node can have up to 10 sectors, and each update adds or deletes a sector.
    resettingPie = true;
    updateGraph();
  }
  graphForce.start();
  updateGraph();
}

d3.select("#pieUpdated").on('click', function(){    
  if(checkProbabilitySum()){
    pieUpdated();
  }
  else{
    d3.select("#pieErrorAlert").text("Probabiltiies must sum to 1!");
    setTimeout(function () {d3.select("#pieErrorAlert").text("");}, 3000);
  }
});  

function deleteNode(){;
  var displayDifferentPie = false;
  if(selectedNode === pieNode){
    displayDefaultPie();
  }
  var i = nodes.indexOf(selectedNode);
  nodes.splice(i, 1);
  if(pieNameLabel !== null){
    pieNameLabel.remove();
    pieNameLabel = null;
  }
  //Delete connected links:
  var remainingLinks = [];
  var deletedLinks = [];
  links.forEach(function(l) {
    if (l.source !== selectedNode && l.target !== selectedNode) {
      remainingLinks.push(l);
    }
    else{
      deletedLinks.push(l);
    }
  });
  deletedLinks.forEach(deleteLink);
  links = remainingLinks;
  selectedLink = links.length ? links[i > 0 ? i - 1 : 0] : null;
  defaultPie = true;
  pieNode = null;
  displayDefaultPie();

  //Instead displays another node on LHS.
  //This could confuse the user as to whether the delete has occured,
  //and the choice of node would need to be further considered.
      //e.g. last added, closest physically, conditional relations etc. 
 // selectedNode = nodes.length ? nodes[i > 0 ? i - 1 : 0] : null;
 // if(selectedNode){
 //   defaultPie = false;
 //   pieNode = selectedNode;
 //   displayPie(pieNode);
 // } else{ //Graph is empty, so display default graph!
 //   defaultPie = true;
 //   pieNode = null;
 //   displayDefaultPie();
 //}
}

function updateConditionalTable(affectedNode){
  conditionsOnAffectedNode = [];
  for(var l = 0; l < links.length; l++){
    linkbeingChecked = links[l];
    if (linkbeingChecked.target == affectedNode) { 
      var conditionedOnNode = linkbeingChecked.source;
      conditionsOnAffectedNode.push(conditionedOnNode);
    }
  }
  if(conditionsOnAffectedNode.length === 0){
    //No more conditionals
    var affectedNodeValues = affectedNode.values;
    var sectorFraction = math.fraction(1, affectedNodeValues.length);
    var newPieDataset = new Array();
    for(var s = 0; s < affectedNodeValues.length; s++){
      newPieDataset.push({"label": affectedNodeValues[s], "id": (s + 1), "value": sectorFraction});
    }
    affectedNode.variablePie = newPieDataset;
    affectedNode.conditionalTable = null;
    resettingPie = true;
  }
  else{
    affectedNode.conditionalTable = null;
    if(conditionsOnAffectedNode.length >= 1){
      var variableConditionedOn = conditionsOnAffectedNode[0];
      addConditionality(variableConditionedOn, affectedNode);
    }
    if (conditionsOnAffectedNode.length == 2){
      var variableConditionedOn = conditionsOnAffectedNode[1];
      addConditionality(variableConditionedOn, affectedNode);
    }
  }
  if(affectedNode == pieNode){
    displayVariableOnPie(affectedNode);
  }
  graphForce.stop();
  updateGraph();
  graphForce.start();
  updateGraph();
}

function deleteLink(link){
  var i = links.indexOf(link);
  links.splice(i, 1);
  var affectedNode = link.target; 
  //Will have had its conditionals reduced.
  updateConditionalTable(affectedNode);
}

function keydown() { //https://www.toptal.com/developers/keycode
  switch (d3.event.keyCode) {
    //Can only have either shift or isZooming as they'd be a drag-panning conflict. 
    case 90: { //Z key
      if(!shift){
        isZoomingKey = true;
      }
      break;
    }
    case 16: { // shift
      if(!isZoomingKey){
        shift = true;
        console.log("shift is true now");
      }
      break;
    }
    case 8: { // delete
      if(deletingAffectsGraph && shift){
        if (selectedNode) { //Node
          deleteNode();
          
        } else if (selectedLink) {  //Link
          deleteLink(selectedLink);
          selectedLink = links.length ? links[i > 0 ? i - 1 : 0] : null;
        }
        updateGraph();
      }
    }
  }
}

function isCyclic(){ //true means contains a cycle. 
  function isCyclicRec(n, nodeBeingChecked){
		if (stack[n]){
      return true;
    }
		if (visited[n]){
      return false;	
    }
		visited[n] = true;
		stack[n] = true;

    for(var l = 0; l < links.length; l++){
      linkbeingChecked = links[l];
      if (linkbeingChecked.source == nodeBeingChecked) { 
          var child = linkbeingChecked.target;
          var inx = nodes.indexOf(child);
          var cycle = isCyclicRec(inx, child);
          
          if (cycle){
            return true;
          }      
      }
    }

		stack[n] = false;
		return false;
  }

  let visited = new Array(nodes.length);
  let stack = new Array(nodes.length);
  for(var n = 0; n < nodes.length; n++){
    visited[n] = false;
    stack[n] = false;
  }	
  for (var n = 0; n < nodes.length; n++){
    nodeBeingChecked = nodes[n];
    var cycles = isCyclicRec(n, nodeBeingChecked);
    if (cycles){
      return true;
    }
  }
  return false;
}
