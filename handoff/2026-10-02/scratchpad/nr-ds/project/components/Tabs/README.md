# Tabs
Top-level navigation between the viewer's views: `.nr-tabs` holding `button.nr-tab[role=tab]`.

- The selected tab is `aria-selected="true"`: ink label with a 2px ink underline. The rest are muted.
- Each tab has `aria-controls` pointing to its panel. Hide inactive panels with the `hidden` attribute.
- Name each tab after the question it answers ("Campeón vs candidato"), not after a system part.
- There is no icon and no count badge.
