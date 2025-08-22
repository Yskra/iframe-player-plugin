export default function waitGlobalField(field, timeout = 10000) {
  return new Promise((resolve, reject) => {
    let timeLeft = timeout;

    checkProperty();

    function checkProperty() {
      if (field in window) {
        resolve(true);
      }
      else {
        timeLeft -= 100;
        if (timeLeft <= 0) {
          resolve(false);
        }
        setTimeout(checkProperty, 100);
      }
    }
  });
}
