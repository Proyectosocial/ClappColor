COLORLAB - MONETIZACION MODULAR

1) Copiar la carpeta completa dentro de htdocs de XAMPP.
2) La monetización está activada por:
   const MONETIZATION_ENABLED=true;
   en config.php.
3) Para apagarla totalmente, cambiar a false.
4) Configurar patrocinador, afiliado y apoyo en:
   modules/monetization/config/monetization-config.js
5) Los enlaces vienen vacíos a propósito: no se inventaron URLs de cobro.
6) La monetización escucha el evento budget:generated y no interviene en los cálculos.
7) Si se elimina la carpeta modules/monetization y se pone MONETIZATION_ENABLED=false,
   el núcleo de ColorLab continúa funcionando.

IMPORTANTE:
funciones.php requiere recetas.php para las acciones PHP de recetas. Ese archivo no fue
incluido entre los archivos compartidos y por eso no se inventó ni se reemplazó.
