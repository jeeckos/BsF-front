(function ($, window, document) {
   'use strict';

   // global variables
   var svg, o, _root, _currentNodeList;

   // Main function
   $.fn.pieMenu = function (options) {
      // settings
      o = $.fn.pieMenu.settings = $.extend({}, $.fn.pieMenu.defaults, options)

      // determine size
      var width = $('#' + o.containerID).width();
      var height = $('#' + o.containerID).height();

      // get max square size
      if(width >= height) {
         width = height / 1.1;
         height = width;
      } else {
         width = width / 1.1;
         height = width;
      }
      
      var divider = 2.4;
      if (o.render3D) divider = 2.1;

      // set sizes
      var radius = width / 2,
          arcInner = radius / divider,
          arcOuter = radius - 4,
          padding = 5;

      var arc = d3.svg.arc()
          .outerRadius(arcOuter)
          .innerRadius(arcInner);
      var arcShadow = d3.svg.arc()
          .outerRadius(arcInner + 1)
          .innerRadius(arcInner - 15);

      // read json data
      d3.json(o.jsonUrl, function(error, root) {
         if(_currentNodeList != undefined) updatePieData(_currentNodeList);
         else {
            _root = root;
            _currentNodeList = _root;
            updatePieData(_root);
         }
      });

      // add media query resize rule
      if($("#pie-resize").length <= 0) {
         $("<style>")
            .prop("type", "text/css")
            .prop("id", "pie-resize")
            .html("\
             @media screen and (max-width: 520px) {\
                 .s-text {\
                    font-size: 2.5vw !important;\
                 }\
             }\
             @media screen and (max-height: 500px) {\
             	 .s-text { font-size: .9vw !important; }\
      		 }")
             .appendTo("head");
      }
      
      // Update the breadcrumb trail to show the current sequence and percentage.
      function updateBreadcrumbs(currentName) {
    	  $('#vis-breadcrumb').empty();
    	  var name_array = new Array();
    	  if(currentName != undefined) {
    		  name_array.push(currentName);
    		  var item = findParent(_root, currentName);
    		  while(item != undefined) {
    			  if(item.name != undefined) {
    				  name_array.push(item.name);
    			  }
    			  item = findParent(_root, item.name);
    		  }
    	  }
    	  name_array.push('HOME');
    	  var list = $("#vis-breadcrumb").append('<ul class="breadcrumb"></ul>').find('ul');
		  for (var i = name_array.length - 1; i >= 0; i--) {
			  if(name_array[i] != undefined) {
				  var nameToRender = name_array[i];
				  if(nameToRender === 'HOME') nameToRender = '<i class="fa fa-home"></i>';
				  
				  if(i == 0) 
					  list.append('<li>' + nameToRender + '</li>');
				  else
					  list.append('<li><a href="#" onclick="$.pieMenu.showNode(\'' + name_array[i] + '\');">' + nameToRender + '</a></li>');
			  }
		  }
      };

      // internal functions
      function updatePieData(root) {
         // empty container
         $('#' + o.containerID).empty();
         $('#' + o.containerID).disableSelection();
         
         // display breadcrumb
         updateBreadcrumbs(root.name);

         // define pie
         var pie = d3.layout.pie()
             .sort(null)
             .value(function(d) {
                 if(d.children)
                     return d.children.length;
                 else return 2;
             });

         // define main svg
         svg = d3.select('#' + o.containerID)
             .append("svg")
             //.attr("preserveAspectRatio", "xMidYMid")
             //.attr("viewBox", "0 0 " + width + " " + height)
             .attr( { width: width, height: height, class: o.render3D ? 'shadow':''})
             .append("g")
             .attr("id", "pieChart")
             .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

         // append defs for logo url
         if(o.logoUrl != '') {
            svg.append("defs")
               .append('pattern')
               .attr( {
                               id: 'bsflogo',
                                x: radius / 2.4,
                                y: radius / 2.4,
                     patternUnits: 'userSpaceOnUse',
                            width: radius / 1.2,
                           height: radius / 1.2
               })
               .append("image")
               .attr("xlink:href", o.logoUrl)
               .attr( {
                               x: 0,
                               y: 0,
                           width: radius / 1.2,
                          height: radius / 1.2
               });
         }

         // render data
         var dataToRender;
         if(root.children != undefined) dataToRender = root.children;
         else dataToRender = root;

         var piedata = pie(dataToRender);
         var onMobile = imOnMobile();

         // base path
         var path = svg.selectAll("path1")
             .data(piedata)
             .enter()
             .append("path")
             .attr("class", "path1")
             .on(onMobile ? "dblclick": "click", click)
             .on("mouseleave", mouseleave)
             .on("mouseover", mouseover)
             .on("touchstart", mouseover)
             .on("touchend", mouseleave);

         path.transition()
             .duration(500)
             .attr("fill", function(d, i) {
                 return d.data.colour;
             })
             .transition().duration(500)
             .attrTween('d', tweenPie);

         // 3d path
         if(o.render3D) {
            var pathShadow = svg.selectAll("path2")
                       .data(piedata)
                       .enter()
                       .append("path")
                       .attr({
                           class: "path2",
                           d: arcShadow,
                           fill: function(d, i) {
                               var c = d3.hsl(d.data.colour);
                               return d3.hsl((c.h+5), (c.s -.07), (c.l -.15));
                           }
                       });

            pathShadow.transition()
                       .duration(1000)
                       .attrTween('d', function(d) {
                           var interpolate = d3.interpolate({startAngle: 0, endAngle: 0}, d);
                           return function(t) {
                               return arcShadow(interpolate(t));
                           };
                       });
         }

         // add text
         var text = svg.selectAll("text").data(piedata);
         var textEnter = text.enter().append("svg:text")
                              .attr("fill", function(d) { return d3plus.color.text(d.data.colour); })
                              .attr("class", "s-text")
                              .style("font-size", "1.5vw")
                              .attr("text-anchor", "middle")
                              .attr("dy", ".2em")
                              .on(onMobile ? "dblclick": "click", click)
                              .on("mouseleave", mouseleave)
                              .on("mouseover", mouseover)
                              .on("touchstart", mouseover)
                              .on("touchend", mouseleave);
         textEnter.append("tspan")
                  .attr("x", 0)
                  .text(function(d) { var str = easySplit(d.data.name, 2); return str[0]; }); //d.data.name.split(" ")[0]; });
         textEnter.append("tspan")
                  .attr("x", 0)
                  .attr("dy", "1em")
                  .text(function(d) { var str = easySplit(d.data.name, 2); return str[1]; }); //return d.data.name.split(" ")[1]; });

         textEnter.transition()
                  .duration(1200)
                  .style("fill-opacity", function(e) { return 1 })
                  .attr("transform", function(d) {
                     d.outerRadius = radius; // Set Outer Coordinate
                     d.innerRadius = radius / 2; // Set Inner Coordinate
                     return "translate(" + arc.centroid(d) + ")rotate(" + angle(d) + ")";
                  });

         // append center logo
         svg.append("circle")
            .attr("class", "logo")
            .attr("id", "item-logo")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", radius / 2.5)
            .attr("fill", "url(#bsflogo) white")
            .on("click", function() {
               if(_currentNodeList.name != undefined) {
                  var parent = findParent(_root, _currentNodeList.name);
                  if(parent != undefined) {
                     _currentNodeList = parent;
                     updatePieData(parent);
                  }
               }
            });
         
         // put name of parent or logo
         if(root.name != undefined)
        	 addCenterText(root.name);
         else
        	 addCenterText("");

         // split string in two parts balanced
         function easySplit(str, maxChunks) {
            var parts = str.split(" ");
            if(parts.length <= 2) return parts;
            else {
               var _len = str.length / 2;
               var newParts = [ "", "" ];
               var idxToAdd = 0;
               for(var i = 0; i < parts.length; i++) {
                  newParts[idxToAdd] = newParts[idxToAdd] + " " + parts[i];
                  if(newParts[idxToAdd].length > _len || i == parts.length - 2) {
                     idxToAdd++;
                     if(idxToAdd >= (maxChunks - 1)) idxToAdd = maxChunks - 1;
                  }
               }
               return newParts;
            }
         }

         // Function to add a center text
         function addCenterText(text) {
              if($('#info-text').length > 0) {
                 d3.select("#info-text").text(text);
              } else {
                 svg.append('text')
                    .text(text)
                    .attr({
                        'text-anchor' : 'middle',
                                   id : 'info-text'
                    })
                    .style({
                        fill : '#666'
                    })
                    .on("click", function() {
                        if(_currentNodeList.name != undefined) {
                           var parent = findParent(_root, _currentNodeList.name);
                           if(parent != undefined) {
                              _currentNodeList = parent;
                              updatePieData(parent);
                           }
                        }
                     });
              }

              // Wrap text in a circle, and size the text to fit.
              if(text != "") {
                 $('#bsflogo').hide();
                 $('#info-text').show();

                 d3plus.textwrap()
                   .container(d3.select("#info-text"))
                   .resize(true)
                   .padding(5)
                   .align("middle")
                   .valign("middle")
                   .draw();

              } else {
                 $('#info-text').hide();
              }
         };

         // hide the center text
         function hideCenterText() {
            $('#info-text').hide();
            $('#bsflogo').show();
         };
         
         // Fade all but the current sequence, and show it in the breadcrumb trail.
         function mouseover(d) {
            // Then highlight only those that are an ancestor of the current segment.
            svg.selectAll(".path1")
               .filter(function(node) { return node.data.name === d.data.name; })
               .attr("fill", function(node) { return d3plus.color.lighter(node.data.colour, -0.4); });

            addCenterText(d.data.name);
         };

         // Restore everything to full opacity when moving off the visualization.
         function mouseleave(d) {
            d3.selectAll(".path1")
              .attr("fill", function(node) { return node.data.colour; });
            
            // put name of parent or hide
            if(root.name != undefined) {
            	hideCenterText();
            	addCenterText(root.name);
            } else
            	hideCenterText();
         };

         // click on leaf node
         function click(d) {
            if(d.data.children != undefined) {
               _currentNodeList = d.data;
               updatePieData(_currentNodeList);
            } else {
               window.location.href = d.data.href;
            }
         };
      };

      // Computes the angle of an arc, converting from radians to degrees.
      function angle(d) {
         var a = (d.startAngle + d.endAngle) * 90 / Math.PI - 90;
         return a > 90 ? a - 180 : a;
      };

      // Find node parent
      function findParent(rootNode, currentName) {
         var itemToCycle;

         // set the correct type for search
         if($.isArray(rootNode)) itemToCycle = rootNode;
         else if(rootNode.children != undefined) itemToCycle = rootNode.children;
         else return;

         // cycle
         for (var index = 0; index < itemToCycle.length; index++) {
            if(itemToCycle[index].name === currentName) {
               return rootNode;
            } else if(itemToCycle[index].children != undefined) {
               var parent = findParent(itemToCycle[index], currentName);
               if(parent != undefined) return parent;
            }
         }
      };

      // Tween animation for pie
      function tweenPie(finish) {
           var start = {
                   startAngle: 0,
                   endAngle: 0
               };
           var i = d3.interpolate(start, finish);
           return function(d) { return arc(i(d)); };
      };

      // Detect mobile browser
      function imOnMobile() {
         if (/iP(hone|od)|android.+mobile|BlackBerry|IEMobile/i.test(navigator.userAgent)) {
             return true;
         } else if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(navigator.userAgent)) {
             return true;
         }
         return false;
      }
   };
   
   // Show the selected node
   $.fn.pieMenu.showNode = function(nodeName) {
	   if(nodeName === 'HOME') {
		   _currentNodeList = _root; 
		   $.pieMenu(o);
	   }
	   else {
		   var nodeToShow = findNode(_root, nodeName);
		   if(nodeToShow != undefined) {
			   _currentNodeList = nodeToShow; 
			   $.pieMenu(o);
		   }
	   }
	   
	   // Find node parent
       function findNode(rootNode, name) {
         var itemToCycle;

         // set the correct type for search
         if($.isArray(rootNode)) itemToCycle = rootNode;
         else if(rootNode.children != undefined) itemToCycle = rootNode.children;
         else return;

         // cycle
         for (var index = 0; index < itemToCycle.length; index++) {
            if(itemToCycle[index].name === name) {
               return itemToCycle[index];
            } else if(itemToCycle[index].children != undefined) {
               var node = findNode(itemToCycle[index], name);
               if(node != undefined) return node;
            }
         }
       };
   };

   // Resize function
   $.fn.pieMenu.resize = function () {
      $('#' + o.containerID).empty();
      $.pieMenu(o);
   };

   // Disable selection on mobile
   $.fn.extend({
       disableSelection: function() {
           this.each(function() {
               this.onselectstart = function() {
                   return false;
               };
               this.unselectable = "on";
               $(this).css('-moz-user-select', 'none');
               $(this).css('-webkit-user-select', 'none');
               $(this).css('-ms-user-select', 'none');
               $(this).css('-o-user-select', 'none');
               $(this).css('user-select', 'none');
               $(this).css('-webkit-tap-highlight-color', 'rgba(0,0,0,0)');
           });
       }
   });

   // Defaults
   $.fn.pieMenu.defaults = {
      containerID: 'vis',      // ID of the item container
      render3D: false,         // Set if the menu needs to render in 'fake' 3D mode
      jsonUrl: '',             // Url of the json source of the component
      logoUrl: '',             // Url of the center logo
   };

   $.pieMenu = $.fn.pieMenu;
})(jQuery, window, document);
