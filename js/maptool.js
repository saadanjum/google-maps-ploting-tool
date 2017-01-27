var map = null;
      var markers = [];
      var coordinates = [];
      var polygons = [];
      var bounds = null;
      var features = [];
      var geoms = [];
      // This example requires the Drawing library. Include the libraries=drawing
      // parameter when you first load the API. For example:
      // <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=drawing">

      function createPolygon(){
        var t = $('#polygon_text').val();
        DrawPolygons(JSON.parse(t));
      }

      function parseCenterLatLng(latlng){
        var latlonArray = latlng.trim().replace(" ", "").split(',');
        return {lat: Number(latlonArray[0]), lng: Number(latlonArray[1])};
      }

      function DrawPolygons(PolyArray, source){
        
        PolyArray.forEach(function(_poly){
          polyCoords = []
          var bounds = new google.maps.LatLngBounds ();
          _poly.forEach(function(_latlng){
            polyCoords.push({lat: _latlng[0], lng: _latlng[1]})
            bounds.extend(new google.maps.LatLng(_latlng[0], _latlng[1]))
          });

          var poly = new google.maps.Polygon({
            paths: polyCoords,
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#FF0000',
            fillOpacity: 0.35
          });
          map.fitBounds(bounds);
          poly.setMap(map);
          polygons.push(poly);
          centerLat = (polyCoords[0][0]+polyCoords[Math.ceil(polyCoords.length/2)][1])/2;
          centerLon = (polyCoords[0][1]+ polyCoords[Math.ceil(polyCoords.length/2)][0])/2;
          map.setCenter({lat: polyCoords[0][0], lng: polyCoords[0][1]});
        });

      }


      function initMap() {
        map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: -34.397, lng: 150.644},
          zoom: 8
        });

        var drawingManager = new google.maps.drawing.DrawingManager({
          drawingMode: google.maps.drawing.OverlayType.POLYGON,
          drawingControl: true,
          drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: ['polygon', 'marker']
          },
          circleOptions: {
            fillColor: '#ffff00',
            fillOpacity: 1,
            strokeWeight: 5,
            clickable: false,
            editable: true,
            zIndex: 1
          }
        });
        drawingManager.setMap(map);

        google.maps.event.addListener(drawingManager, 'overlaycomplete', function(geom) {
          geoms.push(geom);
          if (geom.type == 'polygon'){
            polygons.push(geom.overlay);
            // coordinates.push(geom.overlay.getPath().getArray());
            var wkt = new Wkt.Wkt()
            wkt.fromObject(geom.overlay);
            var j = wkt.toJson();
            $('#array_detail_text').val(JSON.stringify(inverseLatLngFormat(j.coordinates), null, 2));
            $('#wkt_detail_text').val(wkt.write())
            var center = getCenter(geom.overlay);
            $('#centeroid_detail').val(center.lat() + ', ' + center.lng());
          }
          else if (geom.type == 'marker'){
            var lat = geom.overlay.position.lat();
            var lng = geom.overlay.position.lng();
            var wkt = new Wkt.Wkt()
            wkt.fromObject(geom.overlay);
            $('#centeroid_detail').val(lat + ', ' + lng);
            $('#wkt_detail_text').val(wkt.write());
            if ($('#latlontxt').val() == ""){
              $('#latlontxt').val(lat+", "+lng);
            } 
            else{
              $('#latlontxt').val($('#latlontxt').val() + "\n"+lat+", "+lng);
            }
          }
        });

      }


      function drawPolygonFromWKT(){
        wkt = new Wkt.Wkt();
        wkt_text = $('#wkt_polygon_text').val();
        wkt.read(wkt_text);
        obj = wkt.toObject(map.defaults);
        var bounds = new google.maps.LatLngBounds();
        if (Wkt.isArray(obj)) { // Distinguish multigeometries (Arrays) from objects
            for (i in obj) {
                if (obj.hasOwnProperty(i) && !Wkt.isArray(obj[i])) {
                    obj[i].setMap(map);
                    obj[i].setOptions({strokeWeight: 0.5, fillColor: $('#color_txt').val()});
                    features.push(obj[i]);

                    if(wkt.type === 'point' || wkt.type === 'multipoint')
                      bounds.extend(obj[i].getPosition());
                    else
                      obj[i].getPath().forEach(function(element,index){bounds.extend(element)});
                }
            }

            features = features.concat(obj);
        } else {
            obj.setMap(map); // Add it to the map
            obj.setOptions({strokeWeight: 0.5, fillColor: $('#color_txt').val()});
            features.push(obj);

            if(wkt.type === 'point' || wkt.type === 'multipoint')
              bounds.extend(obj.getPosition());
            else
              obj.getPath().forEach(function(element,index){bounds.extend(element)});
        }

        // Pan the map to the feature
        map.fitBounds(bounds);

      }

      function inverseLatLngFormat(coordinates){
        coordinates.forEach(function(polygon){
            polygon.forEach(function(point){
              var t = point[0]
              point[0] = point[1]
              point[1] = t
            });
          });
        return coordinates;
      }

      function parsePolygonCoordinates(){
          var coor = []
          var coordinateText = []
          coordinates.forEach(function(polygon){
            poly = []
            polygon.forEach(function(point){
              lat = point.lat();
              lng = point.lng();
              poin = []
              poin.push(lat);
              poin.push(lng);
              poly.push(poin)
            });
            coor.push(poly)
          });
          coordinateText = JSON.stringify(coor,null, 2);
          return coordinateText;
      }

      function centerMap(){
        center = $('#center_input').val()
        map.setCenter(parseCenterLatLng(center));
      }


      function getCenter(polygon){
        var path = polygon.getPath().getArray()
        var bounds = new google.maps.LatLngBounds();
        path.forEach(function(point){
          bounds.extend(point);
        });
        return bounds.getCenter();
      }

      function plotlatlon(){
          var text = $('#latlontxt').val();
          var latlongs = text.split("\n");
          latlongs.forEach(function(latlon){
              var latlonArr = latlon.split(",");
              var myLatLng = {lat: Number(latlonArr[0]), lng: Number(latlonArr[1])};
              var marker = new google.maps.Marker({
                  position: myLatLng,
                  map: map,
                  title: latlon
              });
              map.setCenter(myLatLng);
              map.setZoom(20);
              markers.push(marker);
          });
      }