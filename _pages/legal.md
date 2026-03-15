---
layout: subpage
data_key: legal
body_class: legal-layout
---
{% assign legal = site.data.legal[site.active_lang] | default: site.data.legal.tr %}

<section class="page-section legal-section" id="legal">
<div class="container">
<div class="col-lg-10 offset-lg-1">

<div class="text-center mb-5">
  <h2 class="section-heading text-uppercase">{{ legal.title }}</h2>
  <p class="legal-updated">{{ legal.updated }}</p>
</div>

<div class="legal-accordion" id="legalAccordion" role="list">
{% for card in legal.cards %}
  <div class="legal-card" role="listitem">
    <button class="legal-card__header collapsed" data-toggle="collapse" data-target="#legal-{{ card.id }}" aria-expanded="false" aria-controls="legal-{{ card.id }}">
      <span class="legal-card__icon-wrap" aria-hidden="true"><i class="{{ card.icon }}"></i></span>
      <span class="legal-card__title">{{ card.title }}</span>
      <i class="fas fa-chevron-down legal-card__chevron" aria-hidden="true"></i>
    </button>
    <div id="legal-{{ card.id }}" class="collapse legal-card__body" data-parent="#legalAccordion">
      <div class="legal-card__content">
        {% capture doc %}{% include {{ card.include }} %}{% endcapture %}{{ doc | markdownify }}
      </div>
    </div>
  </div>
{% endfor %}
</div><!-- /.legal-accordion -->

</div>
</div>
</section>
