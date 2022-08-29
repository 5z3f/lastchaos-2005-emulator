#ifndef __LCCRYPT_H__
#define __LCCRYPT_H__

#define LCCNM_META_DATA_SIZE		5

// ��ȣŰ ���� ������
#define CNM_KEY_TYPE				unsigned int

// ��ȣ/��ȣ ���� ũ��
#define CNM_TEMP_BUFFER_LENGTH	(MAX_MESSAGE_DATA + LCCNM_META_DATA_SIZE)

// ���̺귯������ ���ǵǾ� �Ǵ� �Լ�

#ifdef _MSC_VER
#ifdef  __cplusplus
extern "C" {
#endif // __cplusplus
#endif // _MSC_VER

// ��ȣŰ �ʱ�ȭ �Լ�
extern void CNM_InitKeyValue(CNM_KEY_TYPE* pKey);

// ��ȣŰ ���� �Լ� : ���� ��ȣŰ�κ��� ���� ��ȣŰ�� ����
extern void CNM_NextKey(CNM_KEY_TYPE* pKey);

// ��ȣŰ ����
extern void CNM_CopyKey(CNM_KEY_TYPE* pDestKey, const CNM_KEY_TYPE* pSrcKey);

// ��ȣȭ
// return value		��ȣȭ�� ����, ���� �߻��� ����
// pSrc				���� ������
// nLenSrc			���� ������ ����
// pKey				��ȣŰ ������
// pDest			��� ����
extern int CNM_Crypt(const unsigned char* pSrc, int nLenSrc, CNM_KEY_TYPE* pKey, unsigned char* pDest, unsigned char* pTmpBuf);

// ��ȣȭ
// return value		��ȣ�� ����, ���� �߻��� 0 �Ǵ� ����
// pSrc				��ȣ�� ������
// nLenSrc			��ȣ�� ������ ����
// pKey				��ȣŰ ������
// pDest			��� ����
// pTmpBuf			��ȣ�� �ӽ� ����
extern int CNM_Decrypt(const unsigned char* pSrc, int nLenSrc, CNM_KEY_TYPE* pKey, unsigned char* pDest, unsigned char* pTmpBuf);

/////////////////////////////////////////
// LC ��ü ��ȣȭ������ �̻���ϴ� �Լ���
// Seed ���� : Client
// return value		������ Seed Value
// strID			User ID
// strPW			User Password
// nTickCount		return value of GetTickCount()
extern unsigned int CNM_MakeSeedForClient(const char* strID, const char* strPW, unsigned long nTickCount);

// Seed ���� : Server
// return value		������ Seed Value
// nRandom			Random Value
// nPulse			Server Pulse
extern unsigned int CNM_MakeSeedForServer(int nRandomValue, int nServerPulse);

// Seed���� Key ����
// pKey				������ Key�� ������ ��
// nSeed			����� Seed Value
extern void CNM_MakeKeyFromSeed(CNM_KEY_TYPE* pKey, unsigned int nSeed);
// LC ��ü ��ȣȭ������ �̻���ϴ� �Լ���
/////////////////////////////////////////

#ifdef _MSC_VER
#ifdef  __cplusplus
}
#endif // __cplusplus
#endif // _MSC_VER

#endif // __LCCRYPT_H__
