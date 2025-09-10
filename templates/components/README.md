# Nüshu Project Components

## Header Component (`header.html`)

A reusable navigation header component used across the Nüshu project.

### Usage

Include the header component in any template:

```html
<!-- Include Header Component -->
{% include 'components/header.html' %}
```

### Features

- ✅ **Responsive Design**: Works on all screen sizes
- ✅ **Consistent Styling**: Unified design language across pages
- ✅ **Interactive Effects**: Hover animations and transitions
- ✅ **Glass Morphism**: Semi-transparent background with backdrop blur
- ✅ **Z-index Management**: Proper layering with other page elements

### Current Usage

The header component is currently used in:
- `landingpage.html` - Main landing page
- `see.html` - Upload/selection page
- `about.html` - About page
- `dictionary.html` - Dictionary page

### Customization

To modify the header globally, edit `templates/components/header.html`. Changes will automatically apply to all pages using the component.

### Dependencies

- Tailwind CSS classes
- Inknut Antiqua font family
- Proper z-index management

## Future Components

Consider creating additional reusable components:
- Footer component
- Modal components
- Button components (already implemented in CSS)
- Card components

## Best Practices

1. Always include the header component at the top of page templates
2. Ensure proper spacing (`pt-20` or similar) for header height
3. Maintain consistent z-index values across components
4. Test responsiveness on all target devices



