import MainContainer from './components/MainContainer';
import { useMediaQuery } from '@mui/material';
import MainContainerMobile from './components/MobileMain';


function HomePage() {
  const isMobile = useMediaQuery('(max-width:600px)');
  // console.log("HomePage.jsx: старт рендера");
  // useEffect(() => {
  //   if (typeof window !== 'undefined' && window.mainStart) {
  //     console.log("HomePage.jsx: первый рендер завершён, время:", Date.now() - window.mainStart, "мс");
  //   }
  // }, []);

  return (
    <div>
      {isMobile ? <MainContainerMobile /> : <MainContainer />}
      {/* <MainContainer /> */}
    </div>
  );
}

export default HomePage;
