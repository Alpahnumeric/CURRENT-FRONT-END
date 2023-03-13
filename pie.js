var width = 300,
height = 300,
radius = Math.min(width, height) / 2,
path,
should_delete = false,
selectedSector = null,
selectedCell = null,
colorScale,
variableName = null,
defaultPie = true,
defaultColorScale = d3.scale.category10(),
conditionalTable = null, 
conditionedOnVariables = null,
conditionedOnLabels = null,
observedValue = null,
variableValues = null;

///'#e0e0e0'grey, #90EE90 green, '#ffffff' white

//pie.js is run before force.js, so any shared variables are declared in pie.js.
//Use of the same colour scale variable appeared to be necessary upon coming across a bug whereby the same set of colours
//were used in both the RHS and corresponding LHS pie, but for different variable outcomes.
//The RHS pie was correctly following the colour ordering of category10 (id 1 is blue, 2 is orange, 3 is green etc.), while
//the LHS pie wasn't. Sharing a colour scheme fixed this issue. 

document.getElementById("updateTable").style.display = "none";

d3.select(window)
  .on("keydown", keydown)
  .on("keyup", keyup)

var pieDataset = [];

var pieContainer = d3v5.select("#chart2").append('svg')
  .attr("width", width)
  .attr("height", height)
  .append('g')
  .attr('transform', 'translate(' + (width/ 2) + ',' + (height/ 2) + ')')
  //.style('margin', 'auto'); Doesn't align to centre. 

var pieArc = d3v5.arc()
    .innerRadius(0)
    .outerRadius(radius);

var varPie = d3v5.pie()
  .value(function(d) { return math.number(d.value); })
  .sort(null);

var table = document.getElementById("conditionalProbabilityTable");
table.addEventListener("click", tableClick);
document.getElementById("pieChartName").textContent = "Welcome!";
var sectorOptions = null;

generatePie(false);

function generatePieColourScale(dataSet){
  if (selectedSector){
    var colourArr = dataSet.map(function(currentDatum){
      if(currentDatum.id === 0){
        return '#ffffff';
      }
      else if (selectedSector.id === currentDatum.id){
        return defaultColorScale(currentDatum.id);
      }
      else{
        return "#a3a9a8";
      }
    });
  }
  else if(observedValue){
    var colourArr = dataSet.map(function(currentDatum){
      if(currentDatum.id === 0){
        return '#ffffff';
      }
      else if (observedValue.id === currentDatum.id){
        return defaultColorScale(currentDatum.id);
      }
      else{
        return "#a3a9a8";
      }
    });
  }
  else{ //Standard pie colour display
    var colourArr = dataSet.map(function(currentDatum){
      if(currentDatum.id === 0){ 
        //id = 0 indicates whitespace, as values add up to less than 1. 
        return '#ffffff';
      }
      else{
        return defaultColorScale(currentDatum.id);
      }
    });
  }
  var colorScale = d3.scale.ordinal().range(colourArr);
  return colorScale;
} 

function generatePie(updatedPie){
  var sum = pieDataset.map(function(sector){return sector.value}).reduce((partialSum, n) => partialSum.add(new math.fraction(n)), math.fraction(0));
  sum = math.fraction(sum);
  fullCirclePieDataset = pieDataset.slice();
  var sumToOne = d3.select("#pieSumToOneIndicator");
  if(math.fraction(1) > sum){
    if(pieDataset.length !== 0){
      sumToOne.text("✘");
      sumtoOne = document.getElementById("pieSumToOneIndicator");
      sumtoOne.style.color = 'red';
    }
    fullCirclePieDataset.push({"label": "", "id": 0, "value": 1 - sum});

  }
  else if(math.fraction(1) < sum){
    sumToOne.text("✘");
    sumtoOne = document.getElementById("pieSumToOneIndicator");
    sumtoOne.style.color = 'red';
  }
  else{
    var sumToOne = d3.select("#pieSumToOneIndicator");
    sumToOne.text("✔");
    sumtoOne = document.getElementById("pieSumToOneIndicator");
    sumtoOne.style.color = 'darkgreen';
    if(conditionalTable === null){ 
      if(updatedPie){
        pieUpdated(); //Pie chart is valid, so update the graph accordingly. 
      //Conditoned on nodes don't change in pie form on the graph.
      }
    }
  }

  processedPieDataset = new Array();
  for(var s = 0; s < fullCirclePieDataset.length; s++){
    var sector = fullCirclePieDataset[s];
    if(sector.value !== 0.0){
      processedPieDataset.push(sector);
    }
  }
  colorScale = generatePieColourScale(processedPieDataset); 
  
  piePath = pieContainer.selectAll('path')
    .data(varPie(processedPieDataset), function(d){return d.data.id})
    .enter()
    .append('path')
    .attr('d', pieArc)
    .attr('fill', function(d) {return colorScale(d.data.id);})
    .attr("stroke", "black")
    .style("stroke-width", "1px")
    //.style("opacity", 0.7)  
    //Possibly use? Do research into best colors for education
    .each(function(d) {this._current = d;})
    .classed("selected", function(d) {return d === selectedSector;});

  piePath
    .on('click', sectorClick);
  
  pieText = pieContainer.selectAll('text')
    .data(varPie(processedPieDataset), function(d){return d.data.id})
    .enter()
    .append('text')
    .attr('d', pieArc)
    .text(function(d){return d.data.label}) 
    .attr("transform", function(d) { return "translate(" + pieArc.centroid(d) + ")"; })
    //.attr("class", "pieContainerText-style");
    .attr("style", "font-family: arial; font-size: 20; fill: black; stroke: none; text-anchor: middle");

  var legendRectSize = 25; // defines the size of the colored squares in legend
  var legendSpacing = 6; // defines spacing between squares

  var legend = pieContainer.selectAll('.legend')
    .data(colorScale.domain())
    .enter() // creates placeholder
    .append('g') // replace placeholders with g elements
    .attr('class', 'legend') // each g is given a legend class
    .attr('transform', function(d, i) {                   
      var height = legendRectSize + legendSpacing; // height of element is the height of the colored square plus the spacing      
      var offset =  height * colorScale.domain().length / 2; // vertical offset of the entire legend = height of a single element & half the total number of elements  
      var horz = 18 * legendRectSize; // the legend is shifted to the left to make room for the text
      var vert = i * height - offset; // the top of the element is hifted up or down from the center using the offset defiend earlier and the index of the current element 'i'               
        return 'translate(' + horz + ',' + vert + ')'; //return translation       
     });
  
  // adding colored squares to legend
  legend.append('rect') // append rectangle squares to legend                                   
    .attr('width', legendRectSize) // width of rect size is defined above                        
    .attr('height', legendRectSize) // height of rect size is defined above                      
    .style('fill', colorScale) // each fill is passed a color
    .style('stroke', colorScale) // each stroke is passed a color
    .on('click', function(label) {
      var rect = d3.select(this); // this refers to the colored squared just clicked
      var enabled = true; // set enabled true to default 
    });
  
  // adding text to legend - seems to cause a lot of problems in code.
  //legend.append('text')                                    
  //  .attr('x', legendRectSize + legendSpacing)
  //  .attr('y', legendRectSize - legendSpacing)
  //  .text(function(d) { return d; }); // return label 

  singleValuePieCheck();
}

function dropDownSectorSelected(){
  var optionSelected = this.options[this.selectedIndex].text;
  var selected = true;
  if(optionSelected === "None"){
    selectedSector = null;
    d3.select("#pieInstruction1").text("To view/edit a sector, click on it or use the drop-down:"  + "\u00A0");
    if(conditionalTable === null){ 
      d3.select("#pieSectorAddOrModify").text("Add");
      d3.select("#pieInstruction2").text("To add a variable option, enter it's name and value: ");
    }
    else{
        d3.select("#pieInstruction2").text("When done, press 'Update Table' to confirm any modifications.");
    }
    clearInputs();
    resetPie();
    generatePie(false);
    transitionPie();
    setTimeout(function () {selected = false;}, 100);
    return;
  }
  pie.value(function(sector) {
    if(selected){
      if (sector.label === optionSelected){
        selectedSector = sector;
        clearInputs();
        sectorSelected();
        resetPie();
        generatePie(false);
        transitionPie();
        setTimeout(function () {selected = false;}, 100);
      }
    } 
    //Necessary as otherwise the D3 function run every time pie is updated, leading
    //to incorrect setting of SelectedSector. 
  });
}

function sectorSelected(){
  d3.select("#pieSectorAddOrModify").text("Modify");
  d3.select("#pieInstruction1").text("Press enter to select this as the observed value: " + "\u00A0");
  //\u00A0 is the unicode literal for a non breaking space. 
  if(conditionalTable === null){ 
    d3.select("#pieInstruction2").text("Modify this sector by changing its name or value: ");
  }
  else{
    d3.select("#pieInstruction2").text("Modify this sector by changing its value: ");
      //IN order to be able to change sector names, it would have to be 
      //reflected in EVERY conditional cell entry.
  }

  document.getElementById('sectorName').value = selectedSector.label;
  //Get the sector's value from the dataset, as it'll indicate whether it was entered as a decimal or fraction. 
  for (var index = 0; index < pieDataset.length; ++index) { 
    var sector = pieDataset[index];
    if(sector.id === selectedSector.id){
      selectedSectorValue = sector.value;
    }
  }
  
  if(typeof selectedSectorValue === 'number'){ //i.e. The value was entered as a decimal.
    document.getElementById('sectorDecimal').value = selectedSector.value;
  }
  else{ //The value was entered as a math.js fraction, which is an object.
    var fraction = selectedSector.value;
    document.getElementById('sectorNumerator').value = selectedSectorValue.n;
    document.getElementById('sectorDenominator').value = selectedSectorValue.d;
  }
}

function sectorClick(clickedSector){ 
  if(clickedSector.data.id !== 0){ //As id = 0 indicates pie whitespace. 
    deletingAffectsGraph = false; 
    if(selectedSector === null){
      var label = clickedSector.data.label;
      sectorOptions.value = label;
      selectedSector = clickedSector.data;
      sectorSelected();
    }
    else{
      if(clickedSector.data.id === selectedSector.id){
        selectedSector = null;
        sectorOptions.value = "None"; 
        clearInputs();
        if(conditionalTable === null){ 
          d3.select("#pieSectorAddOrModify").text("Add");
          d3.select("#pieInstruction1").text("To view/edit a sector, click on it or use the drop-down:");
          d3.select("#pieInstruction2").text("To add a variable option, enter it's name and value: ");
        }
        else{
            d3.select("#pieInstruction1").text("To view/edit a sector, click on it or use the drop-down:" + "\u00A0");
            d3.select("#pieInstruction2").text("When done, press 'Update Table' to confirm any modifications.");
        }
      }
      else{
        var label = clickedSector.data.label;
        sectorOptions.value = label;
        selectedSector = clickedSector.data;
        clearInputs();
        sectorSelected();
      }
    }
    resetPie();
    generatePie(false);
    transitionPie();
  }
} 

function transitionPie(){
  function arcTransition(a) {
    var i = d3v5.interpolate(this._current, a);
    this._current = i(0);
    return function(t) {
      return pieArc(i(t));
    };
  }

  piePath.transition() 
    .duration(750) 
    .attr('d', pieArc)
    .attr('fill', function(d) {return colorScale(d.data.id);})
    .attrTween("d", arcTransition);

  pieText.transition() 
    .duration(750) 
    .attr('d', pieArc)
    .text(function(d){return d.data.label}) // + ". " + math.format(d.data.value, 2)})
    .attr("transform", function(d) { return "translate(" + pieArc.centroid(d) + ")"; });
}

function resetPie(){
  piePath
    .data(varPie([]), function(datum){return datum.data.id})
    .exit()
    .remove();
  

  pieText
    .data(varPie([]), function(datum){return datum.data.id})
    .exit()
    .remove();

  var pieArc = d3v5.arc()
    .innerRadius(0)
    .outerRadius(radius);
}

function clearInputs(){
  document.getElementById('sectorName').value = "";
  document.getElementById('sectorDecimal').value = "";
  document.getElementById('sectorNumerator').value = "";
  document.getElementById('sectorDenominator').value = "";
}

function sectorAdd(){
  function nameUnique(sectorName){
    for (var i = 0; i < pieDataset.length; ++i) {
      var sector = pieDataset[i];
      if(sector.label === sectorName){
        return false;
      }
    }
    return true;
  }

  if(conditionalTable === null){ 
    //Can only add a sector if the node isn't conditional on others. 
    var sectorName = d3.select("#sectorName").property('value');
    if(sectorName === ""){
      d3.select("#pieErrorAlert").text("Please enter a name!");
      setTimeout(function () {d3.select("#pieErrorAlert").text("");}, 3000);
      return;
    }

    if(!nameUnique(sectorName)){
      d3.select("#pieErrorAlert").text("This outcome is already on this pie chart!");
      setTimeout(function () {d3.select("#pieErrorAlert").text("");}, 3000);
      clearInputs();
      return;
    }

    var sectorValue = d3.select("#sectorDecimal").property('value');
    if(sectorValue === ""){ //Didn't enter a decimal - i.e. enter as fraction
      var sectorNum = d3.select("#sectorNumerator").property('value');
      var sectorDen = d3.select("#sectorDenominator").property('value');
      
      if(sectorDen === "" ||sectorNum === ""){
        d3.select("#pieErrorAlert").text("Please enter a decimal or fraction!");
        setTimeout(function() {d3.select("#pieErrorAlert").text("");}, 3000);
        return;
      }
      if(+sectorNum >= +sectorDen){
        d3.select("#pieErrorAlert").text("Fraction must be proper.");
        setTimeout(function() {d3.select("#pieErrorAlert").text("");}, 3000);
        document.getElementById('sectorNumerator').value = "";
        document.getElementById('sectorDenominator').value = "";
        return;
      }
      var sectorValue = math.fraction(sectorNum, sectorDen);   
    }
    else{ //Entered Decimal
      sectorValue = +sectorValue;
      if(+sectorValue < 0 || +sectorValue > 1){
        d3.select("#pieErrorAlert").text("The probability of a value occuring must be between 0 and 1");
        setTimeout(function() {d3.select("#pieErrorAlert").text("");}, 3000);
        document.getElementById('sectorDecimal').value = "";
        return;
      }
      //If both fraction and decimal are entered, decimal is taken. 
      //This is made clear to the user by removing the fractional input,
      //Leaving only the decimal value displayed after the sector update. 
      document.getElementById('sectorNumerator').value = "";
      document.getElementById('sectorDenominator').value = "";
    }
    var currentids = new Set(pieDataset.map(function(d){return d.id;}));
    var nextid = 1;
    while(currentids.has(nextid)){
      nextid++;
    }
    var sector = {id: nextid, label: sectorName, value: sectorValue};
    pieDataset.push(sector);
    variableValues.push(sectorName);
    clearInputs();
    displaySectorOptions();
    resetPie();
    generatePie(true);
    transitionPie();
  }
  else{
    d3.select("#pieErrorAlert").text("Cannot add values to a node in a Bayesian graph!");
    setTimeout(function () {d3.select("#pieErrorAlert").text("");}, 3000);
  }
}

function sectorModify(){
  var sectorName = d3.select("#sectorName").property('value');
  if(sectorName !== selectedSector.label){
    d3.select("#pieErrorAlert").text("Sector name cannot be modifed!");
    setTimeout(function () {d3.select("#pieErrorAlert").text("");}, 3000);
    document.getElementById('sectorName').value = selectedSector.label;
  }
  else{
    var sectorValue = d3.select("#sectorDecimal").property('value');
    if(sectorValue === ""){ //Entered Fraction
      var sectorNum = d3.select("#sectorNumerator").property('value');
      var sectorDen = d3.select("#sectorDenominator").property('value');
      
      if(sectorDen === "" ||sectorNum === ""){
        d3.select("#pieErrorAlert").text("Please enter a decimal or fraction!");
        setTimeout(function () {d3.select("#pieErrorAlert").text("");}, 3000);
        return;
      }
      if(+sectorNum >= +sectorDen){
        d3.select("#pieErrorAlert").text("Fraction must be proper.");
        setTimeout(function () {d3.select("#pieErrorAlert").text("");}, 3000);
        document.getElementById('sectorNumerator').value = "";
        document.getElementById('sectorDenominator').value = "";
        return;
      }
      var sectorValue = math.fraction(sectorNum, sectorDen);   
    }
    else{ //Entered Decimal
      sectorValue = +sectorValue;
      if(+sectorValue < 0 || +sectorValue > 1){
        d3.select("#pieErrorAlert").text("The probability of a value occuring must be between 0 and 1.");
        setTimeout(function() {d3.select("#pieErrorAlert").text("");}, 3000);
        document.getElementById('sectorDecimal').value = "";
        return;
      }
      //If both fraction and decimal are entered, decimal is taken. 
      //This is made clear to the user by removing the fractional input,
      //Leaving only the decimal value displayed after the sector update. 
      document.getElementById('sectorNumerator').value = "";
      document.getElementById('sectorDenominator').value = "";
    }
    for (var index = 0; index < pieDataset.length; ++index) {
      var sector = pieDataset[index];
      if(sector.id === selectedSector.id){
        sector.value = sectorValue;
        pieDataset[index] = sector;
      }
    }
    resetPie();
    generatePie(true);
    transitionPie();
  }  
}

d3.select("#pieSectorAddOrModify").on('click', function(){
  var button = document.getElementById('pieSectorAddOrModify');
  var text = button.textContent || button.innerText;
  //Whether it's textContent/innerText is browser-dependant.
  if(pieDataset.length !== 0){
    if(text === "Add"){
      sectorAdd();
    }
    else{
      sectorModify();
    }
  }
  else{
    d3.select("#pieErrorAlert").text("Please select a variable in the graph.");
    setTimeout(function () {d3.select("#pieErrorAlert").text("");}, 3000);
  }
});

function displayDefaultPie(){
  document.getElementById("updateTable").style.display = "none";
  table.innerHTML = "";
  table.setAttribute("border", "0");
  variableName = "";
  observedValue = null;
  pieDataset = [];
  conditionalTable = null;
  conditionedOnVariables = null;
  conditionedOnLabels = null;
  selectedSector = null;
  document.getElementById("pieChartName").textContent = "";
  document.getElementById("pieChartDependency").textContent = "";
  d3.select("#pieSectorAddOrModify").text("Add");
  d3.select("#pieInstruction1").text("Select a pie chart variable to view and modify it.");
  d3.select("#pieChartName").text("Select a Variable")
  d3.select("#pieSumToOneText").text("");
  d3.select("#pieSumToOneIndicator").text("");
  if(sectorOptions !== null){
    sectorOptions.remove();
  }
  clearInputs();
  resetPie();
  generatePie(false);
  transitionPie();
  return false;
}

function displaySectorOptions(){
  if(sectorOptions !== null){
    sectorOptions.remove();
  }
  var div = document.getElementById("sectorSelectionContainer");
  div.classList.add("inline");
  sectorOptions = document.createElement("select");
  sectorOptions.classList.add("inline");
  div.appendChild(sectorOptions);
  var opt = document.createElement('option');
  opt.value = "None";
  opt.innerHTML = "None";
  sectorOptions.appendChild(opt);
  sectorOptions.selected = "None"; 
  for (var v = 0; v < variableValues.length; v++){
    var value = variableValues[v];
    var opt = document.createElement('option');
    opt.value = value;
    opt.innerHTML = value;
    sectorOptions.appendChild(opt);
  }
  sectorOptions.addEventListener('change', dropDownSectorSelected);
}

function displayPie(){
  document.getElementById("pieContainer").style.display = "block";
  document.getElementById("instructionsContainer").style.display = "none";
}

function displayUnconditionalPie(d){
  displayPie();
  document.getElementById("updateTable").style.display = "none";
  table.innerHTML = "";
  table.setAttribute("border", "0");
  variableName = d.name;
  variableValues = d.values;
  observedValue = d.observedValuePie;
  pieDataset = d.variablePie.slice();
  conditionalTable = null;
  conditionedOnVariables = null;
  conditionedOnLabels = null;
  selectedSector = null;
  document.getElementById("pieChartName").textContent = variableName;
  document.getElementById("pieChartDependency").textContent = "";
  d3.select("#pieSectorAddOrModify").text("Add");
  d3.select("#pieInstruction1").text("To view/edit a sector, click on it or use the drop-down:" + "\u00A0");
  d3.select("#pieInstruction2").text("To add a variable option, enter it's name and value: ");
  d3.select("#pieSumToOneText").text("Probabilities sum to 1:" + "\u00A0");
  //\u00A0 is the unicode literal for a non breaking space. 
  d3.select("#updateTableButtonArrow").text("");
  displaySectorOptions();
  clearInputs();
  resetPie();
  generatePie(false);
  transitionPie();
  return false;
}

function displayConditionalPie(d, conditionedOnPies, conditionedLabels){
  displayPie();
  document.getElementById("updateTable").style.display = "none";
  table.innerHTML = "";
  table.setAttribute("border", "0");
  variableName = d.name;
  variableValues = d.values; 
  pieDataset = [];
  observedValue = d.observedValuePie;
  selectedSector = null;
  conditionalTable = d.conditionalTable.slice();
  conditionedOnVariables = conditionedOnPies;
  conditionedOnLabels = conditionedLabels;
  document.getElementById("pieChartName").textContent = variableName;
  document.getElementById("pieChartDependency").textContent = "";
  d3.select("#pieSectorAddOrModify").text("Modify");
  d3.select("#pieInstruction1").text("Click a table cell to bring up the corresponding pie chart.");
  d3.select("#pieInstruction2").text("");
  d3.select("#pieSumToOneText").text("");
  d3.select("#pieSumToOneIndicator").text("");
  d3.select("#updateTableButtonArrow").text("");
  if(sectorOptions !== null){
    sectorOptions.remove();
  }
  clearInputs();
  resetPie();
  generatePie(false);
  transitionPie();
  generateTable();
  return false;
}

function generateTable(){
  const tableBody = document.createElement("tbody");
  //1D Table
  if(conditionedOnVariables.length === 1){
    var numberOfEntries = conditionedOnLabels[0].length;
    const row = document.createElement("tr");
    for (let e = 0; e < numberOfEntries; e++) {
        const cell = document.createElement("td");
        var sectorLabel = conditionedOnLabels[0][e];
        var labelColour = defaultColorScale(sectorLabel.id);
        var p = document.createElement("p");
        p.classList.add("tabletext");
        p.innerHTML = conditionedOnVariables[0] + ": " 
        + " <span class = 'tabletext square' style ='color:" + labelColour + "'>\u{25A0} </span>" 
        //\u{25A0} is ■
        + sectorLabel.label;
        cell.id = e;
        cellPieData = conditionalTable[e];
        if(cellPieData.length == 0){
          cell.setAttribute("colour", '#e0e0e0'); //Changed
        }
        else{
          cell.setAttribute("colour", '#ffffff'); //Changed
        }
        cell.style.background = cell.getAttribute("colour");
        cell.append(p);
        row.appendChild(cell);
        cell.setAttribute("text-align", "center");
    }
    tableBody.appendChild(row);
  }

  //2D Table
  if(conditionedOnVariables.length === 2){
    var numberOfRows = conditionedOnLabels[0].length;
    var numberOfColumns = conditionedOnLabels[1].length;
    for (let r = 0; r < numberOfRows; r++) {
      // creates a table row
      const row = document.createElement("tr");
      //r * rows + column
      for (let c = 0; c < numberOfColumns; c++) {
        // Create a <td> element and a text node, make the text
        // node the contents of the <td>, and put the <td> at
        // the end of the table row.
        const cell = document.createElement("td");
        var sectorLabel1 = conditionedOnLabels[0][r];
        var labelColour1 = defaultColorScale(sectorLabel1.id);
        var sectorLabel2 = conditionedOnLabels[1][c];
        var labelColour2 = defaultColorScale(sectorLabel2.id);
        var p = document.createElement("p");
        p.classList.add("tabletext");
        p.innerHTML = conditionedOnVariables[0] + ": " 
        + " <span class = 'tabletext square' style ='color:" + labelColour1 + "'> \u{25A0}</span>" 
        + sectorLabel1.label + ", " + conditionedOnVariables[1] + ": " 
        +  " <span class = 'tabletext square' style ='color:" + labelColour2 + "'> \u{25A0}</span>" 
        + sectorLabel2.label;        
        cell.id = r +  "," + c; //Index of corresponding entry in conditionalTable. 
        cell.append(p);
        row.appendChild(cell);
        cellPieData = conditionalTable[r][c];
        if(cellPieData.length == 0){
          cell.setAttribute("colour", '#e0e0e0'); //Changed
        }
        else{
          cell.setAttribute("colour", '#ffffff'); //Changed
        }
        cell.style.background = cell.getAttribute("colour");
      }
      //Add the row to the end of the table body
      tableBody.appendChild(row);
    }
  }
   //Put the <tbody> in the <table>
   table.appendChild(tableBody);
   //Appends <table> into <body>
   document.body.appendChild(table);
   // sets the border attribute of tbl to '2'
   table.setAttribute("border", "2");
}

function tableClick(event){
   // Find out if the event targeted or bubbled through a `td` en route to this container element. 
   var element = event.target;
   var cell = null;
   while (element && !cell) {
       if (element.matches("td")) {
           //Found a `td` within the container.
           cell = element;
       } else {
           // Not found
           if (element === this) {
               // Reached the container, so stop. 
               element = null;
           } else {
               // Go to the next parent in the ancestry. 
               element = element.parentNode;
           }
       }
   }
   if (cell !== selectedCell) { 
    d3.select("#pieInstruction1").text("Modify the variable's values and press 'Update Table' when done:" + "\u00A0");
    d3.select("#pieSumToOneText").text("Probabilities sum to 1:" + "\u00A0");
    d3.select("#updateTableButtonArrow").text("🠛"); //HTML code &#129051;
    displaySectorOptions();
    if(selectedCell){
      selectedCell.style.background = selectedCell.getAttribute("colour");
    }
    selectedCell = cell;
    cell.style.background = '#90EE90'; //Changes
    document.getElementById("updateTable").style.display = "block"; 
    var numberOfValues = variableValues.length;
    var tableIndicies = selectedCell.id.split(',');    
    if(conditionedOnVariables.length === 1){
      var cellPieData = conditionalTable[tableIndicies[0]];
    }
    else if(conditionedOnVariables.length === 2){
      var cellPieData = conditionalTable[tableIndicies[0]][tableIndicies[1]];
    }
    else if(conditionedOnVariables.length === 3){
      var cellPieData = conditionalTable[tableIndicies[0]][tableIndicies[1]][tableIndicies[2]];
    }
    if(cellPieData.length == 0){
      //Create default pie, with uniform sectors.
      var cellPieData = [];
      var sectorFraction = math.fraction(1, numberOfValues);
      for(var s = 0; s < numberOfValues; s++){
        cellPieData.push(sectorFraction);
      }
    }

    var newPieDataset = new Array;
    for (var s = 0; s < numberOfValues; s++){
      newPieDataset.push({"label": variableValues[s], "id": (s + 1), "value": cellPieData[s]});
    } 
    pieDataset = newPieDataset;
    selectedSector = null;
    document.getElementById("pieChartName").textContent = variableName;
    var cellText = cell.textContent;
    cellText = cellText.replace(/[\u25A0]/g,''); //Removes squares from text
    document.getElementById("pieChartDependency").textContent = "(" + cellText + ")";
    clearInputs();
    resetPie();
    generatePie(false);
    transitionPie();
   }
}

function singleValuePieCheck(){
  var numberOfZeroEntries = 0;
  var numberOfOneEntries = 0;
  var onlySector = null;
  for(var d = 0; d < pieDataset.length; d++){
    var data = pieDataset[d];
    if(math.number(data.value) == 0){
      numberOfZeroEntries++
    }
    else if(math.number(data.value) == 1){
      numberOfOneEntries++
      onlySector = data;
    }
  }
  if(numberOfZeroEntries == (pieDataset.length - 1) && numberOfOneEntries == 1){
    selectedSector = onlySector;
    sectorSelected();
  }
}

d3.select("#updateTable").on('click', function(){ 
  if(checkProbabilitySum()){
    updateTable();
  }
  else{
    d3.select("#pieErrorAlert").text("Probabiltiies must sum to 1!");
    setTimeout(function () {d3.select("#pieErrorAlert").text("");}, 3000);
  }
});

function updateTable(){
  d3.select("#pieSumToOneText").text("");
  d3.select("#pieSumToOneIndicator").text("");

  var pieValues = [];
  for(var d = 0; d < pieDataset.length; d++){
    var sector  = pieDataset[d];
    pieValues.push(sector.value);
  }
  var tableIndicies = selectedCell.id.split(',');
  if(conditionedOnVariables.length === 1){
    conditionalTable[tableIndicies[0]] = pieValues;
  }
  else if(conditionedOnVariables.length === 2){
    conditionalTable[tableIndicies[0]][tableIndicies[1]] = pieValues;
  }
  else if(conditionedOnVariables.length === 3){
    conditionalTable[tableIndicies[0]][tableIndicies[1]][tableIndicies[2]] = pieValues;
  }
  selectedCell.style.background = '#ffffff'; //Done
  selectedCell.setAttribute("colour", '#ffffff');
  selectedCell = null;
  pieDataset = [];
  resetPie();
  generatePie(false);
  transitionPie();
}

function keyup() {
  switch (d3.event.keyCode) {
    case 16: { // shift
      shift = false;
    }
  }
}

function keydown() {
  switch (d3v5.event.keyCode) {
    case 8: { //Delete
      if(shift && !deletingAffectsGraph){
        deleteSector();
      }
      break;
    }
    case 13:{ //Enter 
      if(!observedValue){ 
        observedValue= {"label": selectedSector.label, "id": selectedSector.id, "value": 1};
        pieUpdated();
      }
      else{
        if(observedValue.label !== selectedSector.label){
          observedValue = {"label": selectedSector.label, "id": selectedSector.id, "value": 1};
          pieUpdated();
        }
        else{
          observedValue = null;
          pieUpdated();
        }
      }
      break
    }
  }
}
  
function keyup() {
  switch (d3v5.event.keyCode) {
    case 8: { // shift
    }
  }
}

function deleteSector(){
    if(conditionalTable === null){
      //Can only delete a sector if the node isn't conditional on others. 
      if(selectedSector){ 
        pieDataset = pieDataset.filter(function(currentDatum){return selectedSector.id !== currentDatum.id});
        var sectorName = selectedSector.label;
        var i = variableValues.indexOf(sectorName);
        variableValues.splice(i, 1);
        selectedSector = null;
        d3.select("#pieSectorAddOrModify").text("Add");
        clearInputs();
        displaySectorOptions();
        resetPie();
        generatePie(true);
        transitionPie();  
      }
    }
  else{
    d3.select("#pieErrorAlert").text("A value can't be removed from a conditional node.");
    setTimeout(function () {d3.select("#pieErrorAlert").text("");}, 3000);
  }
}

function checkProbabilitySum(){ 
  var sum = pieDataset.map(function(sector){return sector.value}).reduce((partialSum, n) =>  partialSum.add(new math.fraction(n)), math.fraction(0));
  //Convert all values to fractions to ensure accurate addition (e.g. 1/3 + 1/3 + 1/3 = 1, rather than a result just under 1 due to storage representations)
  if(math.fraction(1).equals(math.fraction(sum))){
    return true;
  }
  else{
    return false;
  }
}
