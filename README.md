# travis-ci 
[![Travis](https://travis-ci.com/noxturnox/travis-ci.svg?token=yKMsa4yNxnheJMbYCDup&branch=master)](https://travis-ci.com/noxturnox/travis-ci/jobs/190725870#)

Con el grunt ya creamos en cada tienda el archivo config.yml (necesario para el deploy), luego con el grunt también corremos
en cada tienda el @shopify/theme-lint (si lo hacemos en conjunto peta por todos lados), ad+ del js-lint, luego si no hay 
errores solo los archivos modificados (comparando los dos últimos commits) son subidos a sus respectivas tiendas (por 
ahora solo hace un echo, el lunes hacer pruebas reales de deploy).
