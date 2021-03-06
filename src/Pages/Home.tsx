import React, {
  useEffect,
  useState,
  useRef,
} from 'react';
import {
  Alert,
  StatusBar,
  View,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { Modalize } from 'react-native-modalize';
import { ActionButton } from '~/components/ActionButton';
import { Header } from '~/components/Header';
import { Map } from '~/components/Map';
import { MapButtons } from '~/components/MapButtons';
import { handleGetCurrentPosition, requestAcessPermission } from '~/services/getPermission';
import { ModalContent } from '~/components/ModalContent';
import { dimensions } from '~/constants/dimensions';
import { BottomNavbar } from '~/components/BottomNavbar';
import { styles } from '~/styles/styles';
import { getVelocity } from '~/services/getVelocity';
import { stopwatch } from '~/services/stopwatch';
import { defaultPosition } from '../constants/defaultPosition';
import { accelerometer, SensorTypes, setUpdateIntervalForType } from 'react-native-sensors';
import { map, filter } from "rxjs/operators";

export const Home = () => {
  const [position, setPosition] = useState<Geolocation.GeoCoordinates>(defaultPosition)
  const [gpsGranted, setGpsGranted] = useState<boolean>(false)
  const [time, setTime] = useState<number>(0)
  const [speed, setSpeed] = useState<number>(0)
  const [modalOpened, setModalOpened] = useState<boolean>(false)
  const modalRef = useRef<Modalize | null>()
  const interval = useRef<NodeJS.Timer | null>(null)

  const handleGetLocation = () => {
    if (!gpsGranted) {
      requestAcessPermission().then((permission) => {
        if (permission) {
          setGpsGranted(permission)
        }
      })
    }
    handleGetCurrentPosition(setPosition)
  }

  const startCounter = () => {
    setTime(0)
    modalRef.current?.open()
    setModalOpened(true)
  }

  const stopCounter = () => {
    modalRef.current?.close()
    setModalOpened(false)
  }

  // Cronômetro
  useEffect(() => {
    stopwatch({ interval, setTime, modalOpened })
    return () => clearInterval(interval.current as NodeJS.Timeout)
  }, [modalOpened]);

  useEffect(() => {
    handleGetLocation()

    setUpdateIntervalForType(SensorTypes.accelerometer, 1000); // 400 -> Valor padrão

    getVelocity(setSpeed)

  }, [])

  useEffect(() => {
    if (gpsGranted) {
      setInterval(() => {
        handleGetCurrentPosition(setPosition)
      }, 1000)
    }
  }, [gpsGranted])


  return (
    <View style={styles.container}>
      <StatusBar barStyle={'dark-content'} backgroundColor={'white'} />
      <Header title='Pedalada' />
      <Modalize
        ref={modalRef}
        /* Tamanho máximo do modal */
        snapPoint={(dimensions.height / 2.05)}

        /* Evitar fechar o modal com o botão de voltar */
        onBackButtonPress={() => false}

        modalStyle={styles.modalStyle}
        /* Estilização do handle (indicador) do modal */
        handlePosition={'inside'}
        handleStyle={styles.handleStyle}
        withOverlay={false}
      >
        <ModalContent
          stopCounter={stopCounter}
          time={time}
          speed={speed}
        />
      </Modalize>

      <MapButtons
        modalOpened={modalOpened}
        handleChangeMapType={() => Alert.alert('Em breve', 'Próximo commit')}
        handleGetLocation={handleGetLocation}
      />

      <Map gpsEnabled={gpsGranted} position={position} />

      <BottomNavbar>
        <ActionButton
          title='Iniciar Atividade'
          onPress={startCounter}
        />
      </BottomNavbar>
    </View>
  );
};