class Settings {
  constructor() {
    this.div = document.createElement('div');
    this.div.classList.toggle('settings');
    this.holder = document.createElement('div');
    this.holder.classList.toggle('holder');
    this.div.appendChild(this.holder);
    const ok = document.createElement('a');
    ok.addEventListener('click', function() {
      this.parentElement.parentElement.remove();
    });
    ok.textContent = '[apply]';
    this.div.appendChild(ok);
  }

  add(name, type, init, callback, elem_type='input') {
    let label = document.createElement('label');
    label.textContent = name;
    let setting = document.createElement(elem_type);
    setting.addEventListener('change', callback);
    if (type) {
      setting.type = type;
    }
    init(setting);
    this.holder.appendChild(label);
    this.holder.appendChild(setting);
  }
}
class CommonLayer {
  constructor() {
    this.rotation = 0;
    this.x = 0;
    this.y = 0;
    this.title_div = null;
  }
  setupSB(div) {
    this.preview = div;
    this.title_div = div.querySelector('.preview_title');

    let description = document.createElement('span');
    description.classList.toggle('description');
    description.textContent = this.name;
    this.title_div.appendChild(description);

    let delete_option = document.createElement('a');
    delete_option.textContent = '[x]';
    delete_option.style.float = "right";
    delete_option.addEventListener('click', (function() {
      if (confirm("delete \"" + this.name + "\"?")) {
        project.remove(this);
      }
    }).bind(this));
    this.title_div.appendChild(delete_option);
  }
  modifyRotation(degrees) {
    this.rotation += degrees;
  }
  modifyCoordinates(newX, newY) {
    this.x += newX;
    this.y += newY;
  }
}
class TextLayer extends CommonLayer {
  constructor(text) {
    super();
    this.text = text;
    this.size = "14";
    this.color = "#ffffff";
    this.font = "Georgia";
    this.weight = 200;
    this.name = "Text Layer \"" + this.text + "\"";
    this.x = 30;
    this.y = 30;
  }
  setupSB(div) {
    super.setupSB(div);
    var settings = new Settings();
    settings.add('text', null,
      i => i.value = this.text,
      e => this.text = e.target.value,
      'textarea'
    );

    settings.add('color', 'color',
      i => i.value = this.color,
      e => this.color = e.target.value
    );

    settings.add('size', 'number',
      i => i.value = this.size,
      e => this.size = e.target.value
    );
    
    settings.add('font', null,
      select => {
        //only a few fonts... will add more soon
        const options = ['Georgia', 'Arial', 'Monospace', 'Times New Roman', 'Inter'];
        options.forEach(value => {
          const opt = document.createElement('option');
          opt.value = value;
          opt.textContent = value;
          select.appendChild(opt);
        });
        select.value = this.font;
      },
      e => this.font = e.target.value,
      'select'
    );
    
    settings.add('weight', 'range',
      (el) => {
        el.min = 100;
        el.max = 900;
        el.step = 1;
        el.value = this.weight;
      },
      (e) => this.weight = e.target.value
    );

    let settings_link = document.createElement('a');
    settings_link.style.float = "right";
    settings_link.textContent = "[...]";
    settings_link.addEventListener('click', function() {
      popup(settings.div);
    });
    this.title_div.appendChild(settings_link);
  }
  render(canvas_out) {
    canvas_out.save();
    canvas_out.fillStyle = this.color;
    canvas_out.translate(this.x, this.y);
    canvas_out.font = this.weight + " " + this.size + "px " + this.font;
    canvas_out.rotate((this.rotation * Math.PI) / 180);
    canvas_out.fillText(this.text, 0, 0);
    canvas_out.restore();
  }
}
class ImageLayer extends CommonLayer {
  constructor(file) {
    super();
    this.scale = 1;
    this.image = new Image();
    this.width = 0;
    this.height = 0;
    this.name = "Image";
    this.image.crossOrigin = "anonymous";
    if (typeof file === "string") {
      this.image.src = file;
    } else if (file instanceof File) {
      this.image.src = URL.createObjectURL(file);
    }
    this.image.onload = () => {
      this.width = this.image.naturalWidth;
      this.height = this.image.naturalHeight;
      const MAX = 512;
      const scale = Math.min(1, MAX / Math.max(this.width, this.height));
      this.width *= scale;
      this.height *= scale;
    };
  }
  render(canvas_out) {
    canvas_out.save();
    canvas_out.rotate((this.rotation * Math.PI) / 180);
    canvas_out.drawImage(this.image, this.x, this.y, this.width * this.scale, this.height * this.scale);
    canvas_out.restore();
  }
}
class ShapeLayer extends CommonLayer {
  constructor(type) {
    super();
    this.width = 100;
    this.height = 100;
    this.type = type;
    this.name = `${type} Layer`;
    this.color = "#000";
  }
  setupSB(div) {
    super.setupSB(div);
    var settings = new Settings();
    settings.add('color', 'color',
      i => i.value = this.color,
      e => this.color = e.target.value
    );

    settings.add('width', 'number',
      i => i.value = this.width,
      e => this.width = e.target.value
    );
    
    settings.add('height', 'number',
      i => i.value = this.width,
      e => this.height = e.target.value
    );
    
    let settings_link = document.createElement('a');
    settings_link.style.float = "right";
    settings_link.textContent = "[...]";
    settings_link.addEventListener('click', function() {
      popup(settings.div);
    });
    this.title_div.appendChild(settings_link);
  }
  render(canvas_out) {
    canvas_out.save();
    canvas_out.translate(this.x, this.y);
    canvas_out.rotate((this.rotation * Math.PI) / 180);
    canvas_out.fillStyle = this.color;
    if (this.type === "square") {
      canvas_out.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    } else if (this.type === "ellipse") {
      canvas_out.beginPath();
      canvas_out.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
      canvas_out.fill();
    }
    canvas_out.restore();
  }
}
class BrushLayer extends CommonLayer {
  constructor(width, height) {
    super();
    this.type = 'brush';
    this.name = "Brush Layer";
    this.color = "#000";
    this.lineWidth = 5;
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');

    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.lineCap = 'round';
  }
  updateCtx() {
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.lineWidth;
  }
  setupSB(div) {
    super.setupSB(div);
    var settings = new Settings();
    settings.add('color', 'color',
      i => i.value = this.color,
      e => {
        this.color = e.target.value;
        this.updateCtx();
      }
    );
    
    settings.add('weight', 'range',
      (el) => {
        el.min = 1;
        el.max = 40;
        el.step = 1;
        el.value = this.lineWidth;
      },
      (e) => {
        this.lineWidth = parseInt(e.target.value);
        this.updateCtx();
      }
    );

    let settings_link = document.createElement('a');
    settings_link.style.float = "right";
    settings_link.textContent = "[...]";
    settings_link.addEventListener('click', function() {
      popup(settings.div);
    });
    this.title_div.appendChild(settings_link);
  }
  render(ctx) {
    ctx.save();
    ctx.drawImage(this.canvas, 0, 0);
    ctx.restore();
  }
}


class Project {
  constructor() {
    this.layers = [];
    this.palette = [];
    this.canvas = null;
    this.ctx = null;
    this.isDragging = false;
    this.container = document.querySelector("#canvas");
    this.scale = 1;
    this.selected_layer = null;
    this.selected_color = null;
  }

  select(layer) {
    this.deselect();
    this.selected_layer = layer;
    this.selected_layer.preview.classList.toggle('selected');
  }

  deselect() {
    if (this.selected_layer !== null) {
      this.selected_layer.preview.classList.toggle('selected');
    }
  }

  add(layer) {
    let layer_picker = document.getElementById('layers');
    let preview = document.createElement('div');
    let title = document.createElement('div');
    preview.classList.toggle('preview');
    preview.addEventListener('click', (function() {
      this.select(layer);
    }).bind(this));
    title.classList.toggle('preview_title');
    preview.appendChild(title);
    layer_picker.prepend(preview);
    layer.start_time = this.time;
    layer.setupSB(preview);
    this.layers.push(layer);
    this.select(layer);
    if (layer instanceof ImageLayer) {
      layer.image.onload = () => {
        if (!this.canvas) {
          this.canvas = document.createElement("canvas");
          const MAX = 512;
          let scale = Math.min(1, MAX / Math.max(layer.image.naturalWidth, layer.image.naturalHeight));
          this.canvas.width = layer.image.naturalWidth * scale;
          this.canvas.height = layer.image.naturalHeight * scale;
          this.container.appendChild(this.canvas);
          this.ctx = this.canvas.getContext("2d");
          this.setupDragHandler();
          this.setupPinchHandler();
          this.startLoop();
        }
        layer.width = layer.image.naturalWidth;
        layer.height = layer.image.naturalHeight;
      };
    } else {
      if (!this.canvas) {
        this.canvas = document.createElement("canvas");
        this.canvas.width = 400;
        this.canvas.height = 200;
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext("2d");
        this.setupDragHandler();
        this.setupPinchHandler();
        this.startLoop();
      }
    }
  }

  remove(layer) {
    const idx = this.layers.indexOf(layer);
    const len = this.layers.length;
    this.layers.splice(idx, 1);
    let layer_picker = document.getElementById('layers');
    layer_picker.children[len - idx - 1].remove();
  }

  addImage(data) {
    this.add(new ImageLayer(data));
  }

  addText(text) {
    this.add(new TextLayer(text));
  }

  render() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const layer of this.layers) {
      layer.render(this.ctx);
    }
  }

  selectColor(color) {
    this.selected_color = color;
    document.documentElement.style.setProperty('--selected-color', color);
    if (this.selected_layer instanceof BrushLayer) {
      this.selected_layer.color = color;
      this.selected_layer.updateCtx();
    }
  }

  startLoop() {
    const loop = () => {
      this.render();
      requestAnimationFrame(loop);
    };
    loop();
  }
  
  screenToLayer(mouseX, mouseY, layer) {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = mouseX - rect.left;
    const canvasY = mouseY - rect.top;
    const lx = layer.x !== undefined ? layer.x : 0;
    const ly = layer.y !== undefined ? layer.y : 0;
    
    return {
      x: canvasX - lx,
      y: canvasY - ly
    };
  }
  
  setupDragHandler() {
    this.container.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isDragging = true;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        if (this.selected_layer instanceof BrushLayer) {
          const p = this.screenToLayer(e.clientX, e.clientY, this.selected_layer);
          const ctx = this.selected_layer.ctx;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
        }
      }
    });
    this.container.addEventListener('mousemove', (e) => {
      if (this.isDragging && this.layers) {
        const dx = e.clientX - this.lastX;
        const dy = e.clientY - this.lastY;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        if (this.selected_layer instanceof BrushLayer) {
          const p = this.screenToLayer(e.clientX, e.clientY, this.selected_layer);
          const ctx = this.selected_layer.ctx;
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        } else {
          this.offsetX += dx;
          this.offsetY += dy;
          this.move(dx, dy);
        }
      }
    });
    this.container.addEventListener('mouseup', () => {
      this.isDragging = false;
    });
    this.container.addEventListener('mouseleave', () => {
      this.isDragging = false;
    });
  }
  
  setupPinchHandler() {
    let gestureStartRotation = 0;
    let gestureStartScale = 0;
    let wheel = function(e) {
      if (e.ctrlKey || e.shiftKey) {
        e.preventDefault();
        const degs = e.deltaY < 0 ? 10 : -10;
        this.rotate(degs);
      } else if (e.altKey && this.canvas) {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        this.scale *= zoomFactor;
        this.scale = Math.max(0.1, Math.min(this.scale, 3));
        this.canvas.style.transform = `scale(${this.scale})`;
      }
    };
    // safari
    let gesturestart = function(e) {
      this.gesturing = true;
      e.preventDefault();
      gestureStartRotation = e.rotation;
      gestureStartScale = e.scale;
    };
    let gesturechange = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const rotation = e.rotation - gestureStartRotation;
      const scale = e.scale / gestureStartScale;
      gestureStartRotation = e.rotation;
      gestureStartScale = e.scale;

      this.rotate(rotation);
      this.scale *= scale;
      this.canvas.style.transform = `scale(${this.scale})`;
    };
    let gestureend = function(e) {
      this.gesturing = false;
      e.preventDefault();
    };
    const elem = this.container;
    elem.addEventListener('gesturestart', gesturestart.bind(this));
    elem.addEventListener('gesturechange', gesturechange.bind(this));
    elem.addEventListener('gestureend', gestureend.bind(this));
    elem.addEventListener('wheel', wheel.bind(this), {
      passive: false
    });
  }
  
  move(x,y) {
    if (!this.layers) {
      return;
    }
    this.selected_layer.modifyCoordinates(x,y);
  }
  
  rotate(degrees) {
    if (!this.layers) {
      return;
    }
    this.selected_layer.modifyRotation(degrees);
  }
  
  output() {
    if (!this.canvas) {
      return;
    }
    const data = this.canvas.toDataURL('image/png');
    const link = document.createElement('a');
    let fnprompt = prompt("enter image name:");
    let filename;
    if (!fnprompt) {
      filename = "image";
    } else {
      filename = fnprompt;
    }
    link.download = `${filename}.png`;
    link.href = data;
    link.click();
  }
  
  changeSettings() {
    if (!this.canvas) {
      return;
    }
    var settings = new Settings();
    settings.add('width', 'number', 
    (input) => {input.value = this.canvas.width},
    function(event) {
      this.canvas.width = event.target.value;
    }.bind(this));
    
    settings.add('height', 'number', 
    (input) => {input.value = this.canvas.height}, 
    function(event) {
      this.canvas.height = event.target.value;
    }.bind(this));
    popup(settings.div);
  }

  nShape(type) {
    this.add(new ShapeLayer(type));
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
      this.canvas.width = 400;
      this.canvas.height = 200;
      this.container.appendChild(this.canvas);
      this.ctx = this.canvas.getContext("2d");
      this.setupDragHandler();
      this.setupPinchHandler();
      this.startLoop();
    }
  }
  
  enterEyeDropper() {
    if (!this.canvas) {
      return;
    }
    this.canvas.style.cursor = 'crosshair';
    const pickColorOnce = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const canvasWidth = this.canvas.width;
      const canvasHeight = this.canvas.height;
      const scaleX = canvasWidth / rect.width;
      const scaleY = canvasHeight / rect.height;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;
      const pixel = this.ctx.getImageData(x, y, 1, 1).data;

      const r = pixel[0];
      const g = pixel[1];
      const b = pixel[2];
      const a = pixel[3] / 255;
      const rgbaColor = `rgba(${r}, ${g}, ${b}, ${a})`;
      const text = document.createElement('div');
      this.selectColor(rgbaColor);
      this.canvas.removeEventListener('click', pickColorOnce);
      this.canvas.style.cursor = '';
    };

    this.canvas.addEventListener('click', pickColorOnce);
  }
  
  popupPalette() {
    const div = document.createElement('div');
    const container = document.createElement('div');
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    const addbtn = document.createElement('button');
    addbtn.textContent = 'add color';
    container.style.display = "flex";
    container.style.gap = "1px";
    
    div.appendChild(colorInput);
    div.appendChild(addbtn);
    div.appendChild(container);
    
    const renderPalette = () => {
      container.innerHTML = '';
      this.palette.forEach((color) => {
        const block = document.createElement('div');
        block.classList.add('colorBlock');
        block.style.width = "20px";
        block.style.height = "20px";
        block.style.margin = "0px";
        block.style.backgroundColor = color;
        container.appendChild(block);
      });
    };
    
    addbtn.addEventListener('click', () => {
      const color = colorInput.value;
      if (!this.palette.includes(color)) {
        this.palette.push(color);
        renderPalette();
      }
    });
    
    container.addEventListener('click', (event) => {
      if (event.target && event.target.matches('div.colorBlock')) {
        const selectedColor = event.target.style.backgroundColor;
        this.selectColor(selectedColor);
      }
    });
    renderPalette();
    popup(div);
  }
  
  enterBrush() {
    if (!this.canvas) {
      this.add(new BrushLayer(400, 200));
    } else {
      this.add(new BrushLayer(this.canvas.width, this.canvas.height));
    }
  }
}

function popup(text) {
  const div = document.createElement('div');
  div.addEventListener('keydown', function(ev) {
    ev.stopPropagation();
  });
  const close = document.createElement('a');
  close.addEventListener('click', function() {
    div.remove();
  });
  close.textContent = "[x]";
  close.classList.toggle('close');
  div.appendChild(close);
  div.appendChild(text);
  div.classList.toggle('popup');
  document.body.appendChild(div);
}

let project = new Project();
window.addEventListener('keydown', function(ev) {
  if (ev.code == "KeyI") {
    project.enterEyeDropper();
  }
});
function eyedropper() {
  project.enterEyeDropper();
}
function upload() {
  let f = document.getElementById('filepckr');
  f.addEventListener('input', function(e) {
    for (let file of e.target.files) {
      project.addImage(file);
    }
    f.value = '';
  });
  f.click();
}
function exportImage() {
  project.output();
}
function new_text() {
  var text = prompt("type text here:");
  if (!text) return;
  project.addText(text);
}
function updateSettings() {
  project.changeSettings();
}
function newShape() {
  let shapeType = prompt("enter shape type bruh (can be square or ellipse):");
  let final = shapeType.toLowerCase();
  if (shapeType !== "square" && shapeType !== "ellipse") {
    alert("shape type invalid, my bad");
  } else {
    project.nShape(shapeType);
  }
}
function showPalette() {
  project.popupPalette();
}
function newBrush() {
  project.enterBrush();
}
