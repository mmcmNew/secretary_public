import MainContainer from './components/MainContainer';
import { useEffect } from 'react';


function HomePage() {
  // console.log("HomePage.jsx: старт рендера");
  // useEffect(() => {
  //   if (typeof window !== 'undefined' && window.mainStart) {
  //     console.log("HomePage.jsx: первый рендер завершён, время:", Date.now() - window.mainStart, "мс");
  //   }
  // }, []);

  return (
    <div>
      <MainContainer />
    </div>
  );
}

export default HomePage;
