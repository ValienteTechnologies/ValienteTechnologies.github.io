---
layout: subpage
data_key: legal
body_class: legal-layout
---
<div class="container" id="pagecontainer">
<div class="col-lg-10 offset-lg-1">

<div class="text-center mb-5">
  <h1 class="section-heading text-uppercase">Yasal Bildirimler</h1>
  <p class="legal-updated">Son güncelleme: Mart 2026</p>
</div>

<div class="legal-accordion" id="legalAccordion" role="list">

  <!-- Gizlilik Politikası -->
  <div class="legal-card" role="listitem">
    <button class="legal-card__header collapsed" data-toggle="collapse" data-target="#legalGizlilik" aria-expanded="false" aria-controls="legalGizlilik">
      <span class="legal-card__icon-wrap" aria-hidden="true"><i class="fas fa-shield-alt"></i></span>
      <span class="legal-card__title">Gizlilik Politikası</span>
      <i class="fas fa-chevron-down legal-card__chevron" aria-hidden="true"></i>
    </button>
    <div id="legalGizlilik" class="collapse legal-card__body" data-parent="#legalAccordion">
      <div class="legal-card__content">
        {% capture doc %}{% include legal/gizlilik.md %}{% endcapture %}{{ doc | markdownify }}
      </div>
    </div>
  </div>

  <!-- Çerez Politikası -->
  <div class="legal-card" role="listitem">
    <button class="legal-card__header collapsed" data-toggle="collapse" data-target="#legalCerez" aria-expanded="false" aria-controls="legalCerez">
      <span class="legal-card__icon-wrap" aria-hidden="true"><i class="fas fa-cookie-bite"></i></span>
      <span class="legal-card__title">Çerez Politikası</span>
      <i class="fas fa-chevron-down legal-card__chevron" aria-hidden="true"></i>
    </button>
    <div id="legalCerez" class="collapse legal-card__body" data-parent="#legalAccordion">
      <div class="legal-card__content">
        {% capture doc %}{% include legal/cerez.md %}{% endcapture %}{{ doc | markdownify }}
      </div>
    </div>
  </div>

  <!-- Aydınlatma Metni -->
  <div class="legal-card" role="listitem">
    <button class="legal-card__header collapsed" data-toggle="collapse" data-target="#legalAydinlatma" aria-expanded="false" aria-controls="legalAydinlatma">
      <span class="legal-card__icon-wrap" aria-hidden="true"><i class="fas fa-file-alt"></i></span>
      <span class="legal-card__title">Kişisel Verilerin İşlenmesine İlişkin Aydınlatma Metni</span>
      <i class="fas fa-chevron-down legal-card__chevron" aria-hidden="true"></i>
    </button>
    <div id="legalAydinlatma" class="collapse legal-card__body" data-parent="#legalAccordion">
      <div class="legal-card__content">
        {% capture doc %}{% include legal/aydinlatma.md %}{% endcapture %}{{ doc | markdownify }}
      </div>
    </div>
  </div>

  <!-- Saklama ve İmha Politikası -->
  <div class="legal-card" role="listitem">
    <button class="legal-card__header collapsed" data-toggle="collapse" data-target="#legalImha" aria-expanded="false" aria-controls="legalImha">
      <span class="legal-card__icon-wrap" aria-hidden="true"><i class="fas fa-database"></i></span>
      <span class="legal-card__title">Kişisel Veri Saklama ve İmha Politikası</span>
      <i class="fas fa-chevron-down legal-card__chevron" aria-hidden="true"></i>
    </button>
    <div id="legalImha" class="collapse legal-card__body" data-parent="#legalAccordion">
      <div class="legal-card__content">
        {% capture doc %}{% include legal/imha.md %}{% endcapture %}{{ doc | markdownify }}
      </div>
    </div>
  </div>

  <!-- Kullanım Koşulları -->
  <div class="legal-card" role="listitem">
    <button class="legal-card__header collapsed" data-toggle="collapse" data-target="#legalKullanim" aria-expanded="false" aria-controls="legalKullanim">
      <span class="legal-card__icon-wrap" aria-hidden="true"><i class="fas fa-gavel"></i></span>
      <span class="legal-card__title">Kullanım Koşulları</span>
      <i class="fas fa-chevron-down legal-card__chevron" aria-hidden="true"></i>
    </button>
    <div id="legalKullanim" class="collapse legal-card__body" data-parent="#legalAccordion">
      <div class="legal-card__content">
        {% capture doc %}{% include legal/kullanim.md %}{% endcapture %}{{ doc | markdownify }}
      </div>
    </div>
  </div>

  <!-- Kurumsal Bilgiler ve İletişim -->
  <div class="legal-card" role="listitem">
    <button class="legal-card__header collapsed" data-toggle="collapse" data-target="#legalIletisim" aria-expanded="false" aria-controls="legalIletisim">
      <span class="legal-card__icon-wrap" aria-hidden="true"><i class="fas fa-building"></i></span>
      <span class="legal-card__title">Kurumsal Bilgiler ve İletişim</span>
      <i class="fas fa-chevron-down legal-card__chevron" aria-hidden="true"></i>
    </button>
    <div id="legalIletisim" class="collapse legal-card__body" data-parent="#legalAccordion">
      <div class="legal-card__content">
        {% capture doc %}{% include legal/iletisim.md %}{% endcapture %}{{ doc | markdownify }}
      </div>
    </div>
  </div>

</div><!-- /.legal-accordion -->
</div>
</div>
