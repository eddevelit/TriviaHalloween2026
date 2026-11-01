# Mascotas de Halloween

Imagen de origen: `Whimsical Halloween Trio Under the Moon.png`, proporcionada por el usuario. La copia para la portada está en `public/assets/halloween-trio.png`.

Los tres recortes se generaron con la herramienta integrada ImageGen, con la imagen original como objetivo de edición y `transparent_background: true`. Se conservaron los archivos PNG con su canal alfa en `public/assets/`, sin servicios externos durante el juego.

Prompts finales utilizados:

### witch-cat.png

```text
Use case: background-extraction. Input image: edit target, the attached Halloween trio illustration. Asset type: transparent mascot cutout for a local trivia game. Extract ONLY the left tan and dark brown Siamese-style cat wearing the large purple witch hat with orange hat band and purple cape, with its orange pumpkin candy bucket. Preserve its exact character identity, expression, outfit, hand-drawn black ink outlines, colors, proportions and storybook illustration style from the supplied picture. Remove all scenery and ALL other animals, moon, grass, fence, tree, leaves and house. Isolate the whole character including ears/hat, paws and tail if visible, on true transparent background with a little transparent padding on every side. No shadow, text, extra decoration or new objects. Complete only tiny occluded outline areas where necessary for a clean silhouette. One mascot only, centered, full body.
```

### vampire-cat.png

```text
Use case: background-extraction. Input image: edit target, the attached Halloween trio illustration. Asset type: transparent mascot cutout for a local trivia game. Extract ONLY the center black and white cat wearing the black vampire cape with red lining and red bow tie, silver oval collar tag. Preserve its exact character identity, expression, outfit, hand-drawn black ink outlines, colors, proportions and storybook illustration style from the supplied picture. Remove all scenery and ALL other animals, moon, grass, fence, tree, leaves and house. Isolate the whole character including ears/hat, paws and tail if visible, on true transparent background with a little transparent padding on every side. No shadow, text, extra decoration or new objects. Complete only tiny occluded outline areas where necessary for a clean silhouette. One mascot only, centered, full body.
```

### pumpkin-dog.png

```text
Use case: background-extraction. Input image: edit target, the attached Halloween trio illustration. Asset type: transparent mascot cutout for a local trivia game. Extract ONLY the right fluffy black and white dog wearing the orange jack-o-lantern costume and pumpkin cap, with its orange pumpkin candy bucket. Preserve its exact character identity, expression, outfit, hand-drawn black ink outlines, colors, proportions and storybook illustration style from the supplied picture. Remove all scenery and ALL other animals, moon, grass, fence, tree, leaves and house. Isolate the whole character including ears/hat, paws and tail if visible, on true transparent background with a little transparent padding on every side. No shadow, text, extra decoration or new objects. Complete only tiny occluded outline areas where necessary for a clean silhouette. One mascot only, centered, full body.
```

