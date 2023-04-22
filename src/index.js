import Notiflix from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import './css/styles.css';

import GallaryApiService from './scripts/gallary-api-service';
import LoadMoreBtn from './scripts/load-more-btn';

const form = document.querySelector('.search-form');
const galleryWrapper = document.querySelector('.gallery');

const gallaryApiService = new GallaryApiService();
const loadMoreBtn = new LoadMoreBtn({
  selector: '.load-more',
  isHidden: true,
});

const lightbox = new SimpleLightbox('.gallery a', {
  captionDelay: 250,
});

form.addEventListener('submit', onSubmit);
loadMoreBtn.button.addEventListener('click', fetchImages);

function onSubmit(e) {
  e.preventDefault();
  gallaryApiService.query = e.currentTarget.elements.searchQuery.value.trim();
  gallaryApiService.resetPage();
  if (gallaryApiService.query === '') {
    Notiflix.Notify.failure("Sorry, the search string can't be empty. Please try again.");
    loadMoreBtn.hide();
    clearImagesMarkup();
    return;
  }
  loadMoreBtn.show();
  clearImagesMarkup();
  fetchImages().finally(() => form.reset());
}

async function fetchImages() {
  try {
    loadMoreBtn.disable();
    const markup = await getImagesMarkup();
    updateImagesMarkup(markup);
    lightbox.refresh();
    loadMoreBtn.enable();
  } catch (err) {
    onError(err);
  }
}

async function getImagesMarkup() {
  try {
    const { hits, totalHits } = await gallaryApiService.getImages();
    if (hits.length === 0) {
      Notiflix.Notify.failure("Sorry, the search string can't be empty. Please try again.");
      loadMoreBtn.hide();
      return;
    } else if (totalHits / gallaryApiService.per_page <= gallaryApiService.page) {
      Notiflix.Notify.info("We're sorry, but you've reached the end of search results.");
      loadMoreBtn.hide();
    } else if (gallaryApiService.page === 2) {
      Notiflix.Notify.success(`Hooray! We found ${totalHits} images.`);
    }
    return hits.reduce((markup, hit) => markup + createMarkup(hit), '');
  } catch (err) {
    onError(err);
  }
}

function createMarkup({ webformatURL, largeImageURL, tags, likes, views, comments, downloads }) {
  return `<div class="photo-card">
  <a class="gallery__item" href=${largeImageURL}>
  <img src=${webformatURL} alt=${tags} loading="lazy" />
  </a>
  <div class="info">
    <p class="info-item">
      <b>Likes</b>${likes}
    </p>
    <p class="info-item">
      <b>Views</b>${views}
    </p>
    <p class="info-item">
      <b>Comments</b>${comments}
    </p>
    <p class="info-item">
      <b>Downloads</b>${downloads}
    </p>
  </div>
</div>`;
}

function updateImagesMarkup(markup) {
  if (markup !== undefined) galleryWrapper.insertAdjacentHTML('beforeend', markup);
}

function clearImagesMarkup() {
  galleryWrapper.innerHTML = '';
}

function onError(err) {
  console.error(err);
  loadMoreBtn.hide();
  clearImagesMarkup();
}
