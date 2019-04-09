var pos
var arrayAssociativeProducts = []
var flag = 0
var globalPrintAllProducts
var prueba = []
// Prueba travis 52 TRAVIS
/* function paginado(data, pagina) {

    var resta = pagina - 2;
    var suma = pagina;
    var flag = 0;
    globalpag = pagina;
    $("div.snize-pagination ul").empty();
    $("div.snize-pagination ul li:last-child a").removeClass("disabled");

    for (o = 0; o <= Math.ceil(data / 16); o++) {
      if (o === 0) {
        $("div.snize-pagination ul").append(
          "<li><a href='#' onclick='printProducts()' rev='" +
            o +
            "' class='snize-pagination-prev disabled' data-no-instant='true'>«</a></li>"
        );
      } //else if(){
      //}
      else {
        var c = o - 1;
        $("div.snize-pagination ul").append(
          "<li><a href='#' onclick='printProducts()' rev='" +
            c +
            "' data-no-instant='true'>" +
            o +
            "</a></li>"
        );
      }
      if (o === pagina) {
        var num = o + 1;
        $("div.snize-pagination ul li:nth-child(" + num + ") a").addClass(
          "active"
        );
      }

    }
    $("div.snize-pagination ul").append(
      "<li><a href='#' onclick='printProducts()' class='snize-pagination-next' data-no-instant='true'>»</a></li>"
    );

    if (pagina === 1 && pagina === Math.ceil(arrayAssociativeProducts.length / 16)) {
      $("div.snize-pagination ul li:first-child a").addClass("disabled");
      $("div.snize-pagination ul li:last-child a").addClass("disabled");
    } else if (pagina === 1 && pagina !== Math.ceil(arrayAssociativeProducts.length / 16)) {
      $("div.snize-pagination ul li:first-child a").addClass("disabled");
      $("div.snize-pagination ul li:last-child a").removeClass("disabled");
    } else if (pagina > 1 && pagina < Math.ceil(arrayAssociativeProducts.length / 16)) {
      $("div.snize-pagination ul li:last-child a").removeClass("disabled");
      $("div.snize-pagination ul li:first-child a").removeClass("disabled");
    } else {
      $("div.snize-pagination ul li:last-child a").addClass("disabled");
      $("div.snize-pagination ul li:first-child a").removeClass("disabled");
    }

  } */

$.ajax({
  url:
    '/admin/products.json?fields=id,title,body_html,product_type,variants,image,handle',
  headers: {
    'X-Shopify-Storefront-Access-Token': '{{ global_var }}'
  },
  dataType: 'json',
  success: function (data) {
    var countProductsTypes = []
    var tipo = ''
    var arrayProductsTypes = []
    // pregunto si el tamaño de los datos es distinto a cero
    if (data.products.length !== 0) {
      // for que recorre los datos, y me guarda en un array arrayProductsTypes los distintos tipos de productos, buscando sin repetirlos,
      // pero llevando una cuenta de
      // cuantos poductos hay de cada tipo, la cantidad se guarda en el array countProductsTypes, y me imprime los
      // Tipos de Productos y cantidades en la tabla de la izq

      for (var i = 0; i < data.products.length; i++) {
        tipo = data.products[i].product_type
        if ($.inArray(tipo, arrayProductsTypes) === -1) {
          arrayProductsTypes.push(tipo)
          countProductsTypes.push(1)
          $('#snize_filters_block_product_type ul').append(
            "<li><input name='" +
              data.products[i].product_type +
              "' id='" +
              data.products[i].product_type +
              "' type='checkbox'> " +
              arrayProductsTypes[arrayProductsTypes.length - 1] +
              '</input></li>'
          )
        } else {
          // aqui si ya hay un ProductType en el array se le suma para saber cuantos hay de cada uno
          pos = $.inArray(tipo, arrayProductsTypes)
          countProductsTypes[pos] = countProductsTypes[pos] + 1
        }
      }
      // aqui le agrego a cada ProductType la cantidad (cantidad).
      for (var j = 0; j < arrayProductsTypes.length; j++) {
        $('li:contains(' + arrayProductsTypes[j] + ')').append(
          ' (' + countProductsTypes[j] + ')'
        )
      }
    }

    // llamo a la function arrayInputsChecked que me genera un array complicado que uso para imprimir

    arrayInputsChecked(data, 'onLoad')

    // imprimo todos los poductos al entrar en la pagina
    filterBar()

    // guardo la primera pagina de todos los productos para q cuando no haya ningun INPUT marcado la imprima rápidamente

    globalPrintAllProducts = $('div#snize-search-results-grid-mode ul li')

    // le agrego a los checkbox de los Tipos de Productos el metodo onclick
    $('div#snize_filters_block_product_type ul.snize-product-filters-list')
      .find('li input[type="checkbox"]')
      .each(function () {
        $(this).attr('onclick', "checkingInputs(this,'products')")
      })

    // paginado(data.products.length, 1);
  },
  error: function (error) {
    console.log(error)
  }
})

// como la consulta de los Tipos de Productos pero con las Colecciones
$.ajax({
  url: '/admin/collections.json',
  dataType: 'json',
  success: function (results) {
    if (results.collections.length !== 0) {
      for (var i = 0; i < results.collections.length; i++) {
        $('div #snize_filters_block_collections ul').append(
          "<li><input name='" +
            results.collections[i].title +
            "' id='" +
            results.collections[i].id +
            "' type='checkbox'> " +
            results.collections[i].title +
            ' (' +
            results.collections[i].products_count +
            ')</input></li>'
        )
      }
    }
    $('div#snize_filters_block_collections ul.snize-product-filters-list')
      .find('li input[type="checkbox"]')
      .each(function () {
        $(this).attr('onclick', "checkingInputs(this,'collections')")
      })
  },
  error: function (error) {
    console.log(error)
  }
})

// funcion para borrar el contenido de ul de los resultados pintados
function clearPrintedProducts () {
  $('div#snize-search-results-grid-mode ul').empty()
}
// funcion donde formo el associative array con los resultados de los INPUTS marcados
function arrayInputsChecked (data, nameInputCheckedOrOnLoad) {
  prueba = $.extend({}, data)
  for (var i = 0; i < prueba.products.length; i++) {
    Object.keys(arrayAssociativeProducts).forEach(function (e) {
      if (
        arrayAssociativeProducts[e][0].find(function (el) {
          return el.handle === prueba.products[i].handle
        })
      ) {
        data.products = data.products.filter(function (ell) {
          return ell.handle !== prueba.products[i].handle
        })
        console.log(data.products)
      }

      // console.log(i);
    }, arrayAssociativeProducts)

    /* if (bandera===1){
       data.products = prueba;
     } */
  }

  // data.products[i].handle

  arrayAssociativeProducts[nameInputCheckedOrOnLoad] = [data.products]
}

function filterBar () {
  var min = $("input[id='pricemin']").val()
  var max = $("input[id='pricemax']").val()
  var newArray = []
  Object.keys(arrayAssociativeProducts).forEach(function (e) {
    newArray[e] = this[e][0].filter(function (el) {
      return (
        parseFloat(el.variants[0].price) <= max &&
        parseFloat(el.variants[0].price) >= min
      )
    })
  }, arrayAssociativeProducts)

  printProducts(newArray)
}

function checkingInputs (varinput, collectionsOrProducts) {
  if (typeof varinput !== 'undefined' && varinput.checked) {
    if (varinput.checked === true) {
      if (flag === 0) {
        arrayAssociativeProducts = []
        jsonCalls(varinput.id, varinput.name, collectionsOrProducts)
        flag = 1
      } else jsonCalls(varinput.id, varinput.name, collectionsOrProducts)
    }
  } else {
    delete arrayAssociativeProducts[varinput.name]
    if ($('input:checked').length === 0) {
      clearPrintedProducts()
      // delete arrayAssociativeProducts[varinput.name];
      $('div#snize-search-results-grid-mode ul').append(globalPrintAllProducts)
    } else {
      // delete arrayAssociativeProducts[varinput.name];
      filterBar()
    }
  }
}

/* filterAPIbyCollection_idORProduct_type */

function jsonCalls (id, nameInputCheckedOrOnLoad, collectionsOrProducts) {
  if ($('input:checked').length >= 1) {
    clearPrintedProducts()
  }
  if (collectionsOrProducts === 'collections') {
    $.getJSON('/admin/products.json', { collection_id: id })
      .done(function (data) {
        arrayInputsChecked(data, nameInputCheckedOrOnLoad)
        filterBar()
        // printProducts(); //0,num
      })
      .fail(function (error) {
        console.log(error)
      })
  } else {
    $.getJSON('/admin/products.json', { product_type: id })
      .done(function (data) {
        arrayInputsChecked(data, nameInputCheckedOrOnLoad)
        filterBar()
      })
      .fail(function (error) {
        console.log(error)
      })
  }
}

// PROBANDOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
function printProducts (newArray) {
  // pos,num
  var cadena
  var arrayprueba = []
  var obj
  clearPrintedProducts()
  if (newArray !== undefined) {
    arrayprueba = newArray
  } else arrayprueba = arrayAssociativeProducts
  Object.keys(arrayprueba).forEach(function (e) {
    if (newArray !== undefined) {
      obj = this[e]
    } else obj = this[e][0]

    for (
      var i = 0;
      i < obj.length &&
      $('div#snize-search-results-grid-mode ul li').length < 16;
      i++
    ) {
      cadena = obj[i].body_html
      cadena = $.parseHTML(cadena)
      cadena = $(cadena).text()
      if (
        $('div#snize-search-results-grid-mode ul').find(
          'li[id="snize-product-' + obj[i].id + '"]'
        ).length === 0
      ) {
        $('div#snize-search-results-grid-mode ul').append(
          "<li class='snize-product' id='snize-product-" +
            obj[i].id +
            "'><a href='/products/" +
            obj[i].handle +
            "' class='snize-view-link' data-no-instant='true'><div class='snize-item clearfix'><div class='snize-thumbnail-wrapper'><span class='snize-thumbnail'><img src='" +
            obj[i].image.src +
            "' class='snize-item-image' alt='' boder='0'/></span></div><span class='snize-overhidden'><span class='snize-title' style='max-height: 2.8em;'>" +
            obj[i].title +
            "</span><span class='snize-description' style='max-height: 2.8em;'>" +
            cadena +
            "</span><div class='snize-price-list'><span class='snize-price snize-price-with-discount'>" +
            obj[i].variants[0].price +
            "</span><span class='snize-discounted-price'>" +
            obj[i].variants[0].compare_at_price +
            "</span><span class='snize-save-price-wrapper'></span></div><button class='snize-button snize-action-button snize-view-product-button'>Ver Producto</button></span></div></a></li>"
        )
      }
    }

    // paginado(arrayAssociativeProducts.length, pos + 1);
  }, arrayprueba)
}

// SLIDER
$(document).ready(function () {
  $(document).ready(function ($) {
    $('#mySlider').slider({
      range: true,
      min: 1,
      max: 100,
      values: [1, 100],
      slide: function (event, ui) {
        $('#pricemin').val(ui.values[0])
        $('#pricemax').val(ui.values[1])
      },
      stop: function (event, ui) {
        filterBar()
      }
    })
    $('#pricemin').val($('#mySlider').slider('values', 0))
    $('#pricemax').val($('#mySlider').slider('values', 1))
  })
})
