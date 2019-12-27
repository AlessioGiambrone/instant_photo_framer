//const jsPDF= require('jspdf');

var style = 'S';
start_point = [1,1]; // aka: margin
photo_geometries = {
  "fuji_instax_mini": {
    "photo": [6.1, 4.3],
    "frame": [0.75,0.4,1.6,0.4]
  },
  "fuji_instax_mini_h": { // absolutely inelegant but works
    "photo": [4.3, 6.1],
    "frame": [0.4,0.75,0.4,1.6]
  },
  "fuji_instax_wide": {
    "photo": [9.8, 6.2],
    "frame": [0.5,0.75,0.5,1.55]
  },
  "fuji_instax_wide_h": { // absolutely inelegant but works
    "photo": [6.2, 9.8],
    "frame": [0.75,0.5,1.55,0.5]
  }
};

get_centers = function(geometry, sp){
  return {
    "p1": [geometry[0]/2+sp[0], geometry[1]/2+sp[1]],
    "p2": [3*geometry[0]/2+sp[0], geometry[1]/2+sp[1]]
  }
};

draw_page = function(doc, geometry, start_point){
  var style = 'S'
  var bottom = start_point[1]+geometry[0];

  doc.rect(start_point[0], start_point[1], geometry[1], 2*geometry[0], style);
  doc.line(start_point[0], bottom, geometry[1]+start_point[0], bottom);
};

draw_photo = function(doc, p_geometry, center_point, only_photo){
  x0 = center_point[0];
  y0 = center_point[1];
  p_g = p_geometry["photo"];
  f_g = p_geometry["frame"];

  var left = (y0-p_g[0]/2);
  var right = (y0+p_g[0]/2);
  var _top = (x0-p_g[1]/2);
  var bottom = (x0+p_g[1]/2);

  // the photo
  doc.rect(left, _top, p_g[0], p_g[1], style);

  // the frame, if requested - for development purposes!
  if (!only_photo){
    doc.rect(
      left-f_g[0], _top-f_g[1], p_g[0]+f_g[0]+f_g[2], p_g[1]+f_g[3]+f_g[1],
      style);
  }
};

draw_cuts = function(doc, p_geometry, center_point){
  x0 = center_point[0];
  y0 = center_point[1];
  p_g = p_geometry["photo"];
  f_g = p_geometry["frame"];

  // we want an offset that never overlaps
  min = Math.min.apply(Math, f_g)

  var left = (y0-p_g[0]/2)-f_g[0];
  var _top = (x0-p_g[1]/2)-f_g[3];
  var bottom = (x0+p_g[1]/2)+f_g[1];
  doc.line(
    left, _top+min, left+min, _top,
    'S');
  doc.line(
    left, bottom-min, left+min, bottom,
    'S');
};

get_colour = function(i){
  ii = (10-i)*1.5;
  hex = ii.toString(16)[0];
  return "#"+hex+hex+hex;
}

/** gets the wider side and split it to accomodate more photos
 */
split_page = function(geometry, number, intensity){
  m = Math.max.apply(Math, geometry);
  m_index = geometry.indexOf(m);
  g = geometry;
  g[m_index] = m/number;

  return {"i": m_index, "geometry": g};
}

getPdf = function(format, frame, number){
  var doc = new jsPDF({
    unit: 'cm'
  });
  var original_geometry = frame.split("x").map(x => parseInt(x));
  doc.setFontSize(10);
  doc.setDrawColor(get_colour(intensity));
  doc.setLineWidth(0.01);
  draw_page(doc, original_geometry, start_point);
  doc.setLineDash([0.15], 0);
  split_data = split_page(original_geometry, number);
  split_index = split_data.i;
  geometry = split_data.geometry;
  for (i = 0; i < number; i++){
    sp_splitted = start_point[split_index]+i*geometry[split_index];
    sp = start_point;
    sp[split_index] = sp_splitted;
    draw_cuts(doc,
      photo_geometries[format],
      get_centers(geometry, sp).p2
    );
    draw_photo(doc,
      photo_geometries[format],
      get_centers(geometry, sp).p1,
      true
    );
  }
  doc.save(format+"-"+frame+".pdf")
}
