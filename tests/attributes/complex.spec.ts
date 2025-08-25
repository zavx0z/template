import { describe, it, expect } from "bun:test"
import { parseAttributes } from "../../attributes.ts"

describe("комплексные тесты с множественными атрибутами", () => {
  describe("элемент area с shape и coords", () => {
    it("простые статические значения", () => {
      const attrs = parseAttributes('<area shape="rect" coords="0,0,100,100" alt="Прямоугольник">')
      expect(attrs).toEqual({
        string: {
          shape: { type: "static", value: "rect" },
          alt: { type: "static", value: "Прямоугольник" },
        },
        array: {
          coords: {
            splitter: ",",
            values: [
              { type: "static", value: "0" },
              { type: "static", value: "0" },
              { type: "static", value: "100" },
              { type: "static", value: "100" },
            ],
          },
        },
      })
    })

    it("динамические значения в coords", () => {
      const attrs = parseAttributes('<area shape="circle" coords="${center.x},${center.y},${radius}" alt="Круг">')
      expect(attrs).toEqual({
        string: {
          shape: { type: "static", value: "circle" },
          alt: { type: "static", value: "Круг" },
        },
        array: {
          coords: {
            splitter: ",",
            values: [
              { type: "dynamic", value: "center.x" },
              { type: "dynamic", value: "center.y" },
              { type: "dynamic", value: "radius" },
            ],
          },
        },
      })
    })

    it("смешанные значения в coords", () => {
      const attrs = parseAttributes('<area shape="poly" coords="0,0,${width},${height},50,50" alt="Многоугольник">')
      expect(attrs).toEqual({
        string: {
          shape: { type: "static", value: "poly" },
          alt: { type: "static", value: "Многоугольник" },
        },
        array: {
          coords: {
            splitter: ",",
            values: [
              { type: "static", value: "0" },
              { type: "static", value: "0" },
              { type: "dynamic", value: "width" },
              { type: "dynamic", value: "height" },
              { type: "static", value: "50" },
              { type: "static", value: "50" },
            ],
          },
        },
      })
    })

    it("сложные условные выражения в coords", () => {
      const attrs = parseAttributes(
        '<area shape="rect" coords="${isLarge ? "0,0,300,300" : "0,0,100,100"}" alt="Условный прямоугольник">'
      )
      expect(attrs).toEqual({
        string: {
          shape: { type: "static", value: "rect" },
          coords: { type: "dynamic", value: 'isLarge ? "0,0,300,300" : "0,0,100,100"' },
          alt: { type: "static", value: "Условный прямоугольник" },
        },
      })
    })
  })

  describe("элемент img с множественными атрибутами", () => {
    it("src, alt, class, srcset", () => {
      const attrs = parseAttributes(
        '<img src="image.jpg" alt="Изображение" class="photo main" srcset="image.jpg 1x, image@2x.jpg 2x">'
      )
      expect(attrs).toEqual({
        string: {
          src: { type: "static", value: "image.jpg" },
          alt: { type: "static", value: "Изображение" },
        },
        array: {
          class: {
            splitter: " ",
            values: [
              { type: "static", value: "photo" },
              { type: "static", value: "main" },
            ],
          },
          srcset: {
            splitter: ",",
            values: [
              { type: "static", value: "image.jpg 1x" },
              { type: "static", value: "image@2x.jpg 2x" },
            ],
          },
        },
      })
    })

    it("динамические значения в нескольких атрибутах", () => {
      const attrs = parseAttributes(
        '<img src="${image.url}" alt="${image.alt}" class="${image.classes}" srcset="${image.srcset}">'
      )
      expect(attrs).toEqual({
        string: {
          src: { type: "dynamic", value: "image.url" },
          alt: { type: "dynamic", value: "image.alt" },
          class: { type: "dynamic", value: "image.classes" },
          srcset: { type: "dynamic", value: "image.srcset" },
        },
      })
    })

    it("смешанные значения в разных атрибутах", () => {
      const attrs = parseAttributes(
        '<img src="base.jpg" alt="Фото ${user.name}" class="avatar ${user.status}" srcset="base.jpg 1x, ${user.highResImage} 2x">'
      )
      expect(attrs).toEqual({
        string: {
          src: { type: "static", value: "base.jpg" },
          alt: { type: "mixed", value: "Фото ${user.name}" },
        },
        array: {
          class: {
            splitter: " ",
            values: [
              { type: "static", value: "avatar" },
              { type: "dynamic", value: "user.status" },
            ],
          },
          srcset: {
            splitter: ",",
            values: [
              { type: "static", value: "base.jpg 1x" },
              { type: "mixed", value: "${user.highResImage} 2x" },
            ],
          },
        },
      })
    })
  })

  describe("элемент iframe с allow и sandbox", () => {
    it("простые статические значения", () => {
      const attrs = parseAttributes(
        '<iframe src="page.html" allow="camera;microphone" sandbox="allow-scripts allow-same-origin">'
      )
      expect(attrs).toEqual({
        string: {
          src: { type: "static", value: "page.html" },
        },
        array: {
          allow: {
            splitter: ";",
            values: [
              { type: "static", value: "camera" },
              { type: "static", value: "microphone" },
            ],
          },
          sandbox: {
            splitter: " ",
            values: [
              { type: "static", value: "allow-scripts" },
              { type: "static", value: "allow-same-origin" },
            ],
          },
        },
      })
    })

    it("динамические значения в allow", () => {
      const attrs = parseAttributes(
        '<iframe src="${page.url}" allow="${permissions.join(";")}" sandbox="allow-scripts">'
      )
      expect(attrs).toEqual({
        string: {
          src: { type: "dynamic", value: "page.url" },
          allow: { type: "dynamic", value: 'permissions.join(";")' },
          sandbox: { type: "static", value: "allow-scripts" },
        },
      })
    })
  })

  describe("элемент input с accept и class", () => {
    it("простые статические значения", () => {
      const attrs = parseAttributes('<input type="file" accept="image/png,image/jpeg" class="file-input required">')
      expect(attrs).toEqual({
        string: {
          type: { type: "static", value: "file" },
        },
        array: {
          accept: {
            splitter: ",",
            values: [
              { type: "static", value: "image/png" },
              { type: "static", value: "image/jpeg" },
            ],
          },
          class: {
            splitter: " ",
            values: [
              { type: "static", value: "file-input" },
              { type: "static", value: "required" },
            ],
          },
        },
      })
    })

    it("динамические значения в accept", () => {
      const attrs = parseAttributes(
        '<input type="file" accept="${allowedTypes.join(",")}" class="file-input ${isRequired ? "required" : ""}">'
      )
      expect(attrs).toEqual({
        string: {
          type: { type: "static", value: "file" },
          accept: { type: "dynamic", value: 'allowedTypes.join(",")' },
        },
        array: {
          class: {
            splitter: " ",
            values: [
              { type: "static", value: "file-input" },
              { type: "dynamic", value: 'isRequired ? "required" : ""' },
            ],
          },
        },
      })
    })
  })

  describe("элемент link с rel и class", () => {
    it("простые статические значения", () => {
      const attrs = parseAttributes('<link rel="stylesheet preload" href="style.css" class="main-styles">')
      expect(attrs).toEqual({
        string: {
          href: { type: "static", value: "style.css" },
          class: { type: "static", value: "main-styles" },
        },
        array: {
          rel: {
            splitter: " ",
            values: [
              { type: "static", value: "stylesheet" },
              { type: "static", value: "preload" },
            ],
          },
        },
      })
    })

    it("динамические значения в rel", () => {
      const attrs = parseAttributes(
        '<link rel="${isPreload ? "preload" : "stylesheet"}" href="${style.url}" class="styles">'
      )
      expect(attrs).toEqual({
        string: {
          rel: { type: "dynamic", value: 'isPreload ? "preload" : "stylesheet"' },
          href: { type: "dynamic", value: "style.url" },
          class: { type: "static", value: "styles" },
        },
      })
    })
  })

  describe("элемент a с ping и rel", () => {
    it("простые статические значения", () => {
      const attrs = parseAttributes('<a href="https://example.com" ping="/analytics" rel="noopener noreferrer">')
      expect(attrs).toEqual({
        string: {
          href: { type: "static", value: "https://example.com" },
          ping: { type: "static", value: "/analytics" },
        },
        array: {
          rel: {
            splitter: " ",
            values: [
              { type: "static", value: "noopener" },
              { type: "static", value: "noreferrer" },
            ],
          },
        },
      })
    })

    it("динамические значения в ping", () => {
      const attrs = parseAttributes('<a href="${link.url}" ping="${analytics.urls.join(" ")}" rel="noopener">')
      expect(attrs).toEqual({
        string: {
          href: { type: "dynamic", value: "link.url" },
          ping: { type: "dynamic", value: 'analytics.urls.join(" ")' },
          rel: { type: "static", value: "noopener" },
        },
      })
    })
  })

  describe("элемент meta с accept-charset", () => {
    it("простые статические значения", () => {
      const attrs = parseAttributes('<meta charset="UTF-8" accept-charset="UTF-8 ISO-8859-1">')
      expect(attrs).toEqual({
        string: {
          charset: { type: "static", value: "UTF-8" },
        },
        array: {
          "accept-charset": {
            splitter: " ",
            values: [
              { type: "static", value: "UTF-8" },
              { type: "static", value: "ISO-8859-1" },
            ],
          },
        },
      })
    })
  })

  describe("элемент th с headers и class", () => {
    it("простые статические значения", () => {
      const attrs = parseAttributes('<th headers="col1 col2" class="header-cell sortable">')
      expect(attrs).toEqual({
        array: {
          headers: {
            splitter: " ",
            values: [
              { type: "static", value: "col1" },
              { type: "static", value: "col2" },
            ],
          },
          class: {
            splitter: " ",
            values: [
              { type: "static", value: "header-cell" },
              { type: "static", value: "sortable" },
            ],
          },
        },
      })
    })
  })

  describe("элемент ol с itemref и class", () => {
    it("простые статические значения", () => {
      const attrs = parseAttributes('<ol itemref="item1 item2" class="numbered-list">')
      expect(attrs).toEqual({
        string: {
          class: { type: "static", value: "numbered-list" },
        },
        array: {
          itemref: {
            splitter: " ",
            values: [
              { type: "static", value: "item1" },
              { type: "static", value: "item2" },
            ],
          },
        },
      })
    })
  })

  describe("элемент video с sizes и class", () => {
    it("простые статические значения", () => {
      const attrs = parseAttributes('<video sizes="(max-width: 600px) 100vw, 50vw" class="responsive-video">')
      expect(attrs).toEqual({
        string: {
          class: { type: "static", value: "responsive-video" },
        },
        array: {
          sizes: {
            splitter: " ",
            values: [
              { type: "static", value: "(max-width:" },
              { type: "static", value: "600px)" },
              { type: "static", value: "100vw," },
              { type: "static", value: "50vw" },
            ],
          },
        },
      })
    })
  })

  describe("сложные случаи с множественными условными атрибутами", () => {
    it("элемент с условными классами и координатами", () => {
      const attrs = parseAttributes(
        '<area shape="rect" coords="${isLarge ? "0,0,300,300" : "0,0,100,100"}" class="${isActive ? "active" : "inactive"} ${isVisible ? "visible" : "hidden"}">'
      )
      expect(attrs).toEqual({
        string: {
          shape: { type: "static", value: "rect" },
          coords: { type: "dynamic", value: 'isLarge ? "0,0,300,300" : "0,0,100,100"' },
        },
        array: {
          class: {
            splitter: " ",
            values: [
              { type: "dynamic", value: 'isActive ? "active" : "inactive"' },
              { type: "dynamic", value: 'isVisible ? "visible" : "hidden"' },
            ],
          },
        },
      })
    })

    it("элемент с множественными динамическими атрибутами", () => {
      const attrs = parseAttributes(
        '<img src="${image.url}" alt="${image.alt}" class="${image.classes}" srcset="${image.srcset}" sizes="${image.sizes}">'
      )
      expect(attrs).toEqual({
        string: {
          src: { type: "dynamic", value: "image.url" },
          alt: { type: "dynamic", value: "image.alt" },
          class: { type: "dynamic", value: "image.classes" },
          srcset: { type: "dynamic", value: "image.srcset" },
          sizes: { type: "dynamic", value: "image.sizes" },
        },
      })
    })

    it("элемент с смешанными статическими и динамическими атрибутами", () => {
      const attrs = parseAttributes(
        '<iframe src="https://example.com" allow="${permissions.join(";")}" sandbox="allow-scripts ${user.canAccess ? "allow-same-origin" : ""}" class="embed">'
      )
      expect(attrs).toEqual({
        string: {
          src: { type: "static", value: "https://example.com" },
          allow: { type: "dynamic", value: 'permissions.join(";")' },
          class: { type: "static", value: "embed" },
        },
        array: {
          sandbox: {
            splitter: " ",
            values: [
              { type: "static", value: "allow-scripts" },
              { type: "dynamic", value: 'user.canAccess ? "allow-same-origin" : ""' },
            ],
          },
        },
      })
    })
  })

  describe("граничные случаи", () => {
    it("элемент только с строковыми атрибутами", () => {
      const attrs = parseAttributes('<div id="main" title="Заголовок" data-test="value">')
      expect(attrs).toEqual({
        string: {
          id: { type: "static", value: "main" },
          title: { type: "static", value: "Заголовок" },
          "data-test": { type: "static", value: "value" },
        },
      })
    })

    it("элемент только с массивными атрибутами", () => {
      const attrs = parseAttributes('<div class="container" rel="nofollow noopener" ping="/analytics">')
      expect(attrs).toEqual({
        string: {
          class: { type: "static", value: "container" },
          ping: { type: "static", value: "/analytics" },
        },
        array: {
          rel: {
            splitter: " ",
            values: [
              { type: "static", value: "nofollow" },
              { type: "static", value: "noopener" },
            ],
          },
        },
      })
    })

    it("элемент с пустыми значениями", () => {
      const attrs = parseAttributes('<div class="" rel="" title="">')
      expect(attrs).toEqual({
        boolean: {
          title: "true",
        },
        array: {
          class: {
            splitter: " ",
            values: [],
          },
          rel: {
            splitter: " ",
            values: [],
          },
        },
      })
    })
  })
})
